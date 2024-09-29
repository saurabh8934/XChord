import { currentProfilePages } from "@/lib/current-profile-pages";
import { db } from "@/lib/db";
import { NextApiResponseServerIo } from "@/types";
import { MemberRole } from "@prisma/client";
import { NextApiRequest } from "next";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponseServerIo
) {
	if (req.method !== "DELETE" && req.method !== "PATCH") {
		return res.status(405).json({ error: "Method not allowed" });
	}
	try {
		const profile = await currentProfilePages(req);
		const { messageId, channelId, serverId } = req.query;
		const { content } = req.body;

		if (!profile) return res.status(401).json({ error: "Unauthorized" });
		if (!serverId) return res.status(400).json({ error: "ServerID missing" });
		if (!channelId) return res.status(400).json({ error: "ChannelID missing" });

		const server = await db.server.findUnique({
			where: {
				id: serverId as string,
				members: {
					some: {
						profileId: profile.id,
					},
				},
			},
			include: {
				members: true,
			},
		});

		if (!server) return res.status(404).json({ error: "Server not found" });

		const channel = await db.channel.findUnique({
			where: {
				id: channelId as string,
				serverId: serverId as string,
			},
		});
		if (!channel) return res.status(404).json({ error: "Channel not found" });

		const member = server.members?.find(
			(member) => member.profileId === profile.id
		);

		if (!member) return res.status(404).json({ error: "Member not Found" });

		let message = await db.message.findUnique({
			where: {
				id: messageId as string,
				channelId: channelId as string,
			},
			include: {
				member: {
					include: {
						profile: true,
					},
				},
			},
		});

		if (!message || message.delete)
			return res.status(404).json({ error: "Message not found" });

		const isMessageOwner = profile.id === message?.member.profile.id;
		const isAdmin = member.role === MemberRole.ADMIN;
		const isModerator = member.role === MemberRole.MODERATOR;
		const canModify = isMessageOwner || isAdmin || isModerator;

		if (!canModify) return res.status(404).json({ error: "Unauthorized" });

		if (req.method === "DELETE") {
			message = await db.message.update({
				where: {
					id: messageId as string,
				},
				data: {
					fileUrl: null,
					content: "This message has been deleted.",
					delete: true,
				},
				include: {
					member: {
						include: { profile: true },
					},
				},
			});
		}

		if (req.method === "PATCH") {
			if (!isMessageOwner) {
				return res.status(401).json({ error: "Unauthorized" });
			}
			message = await db.message.update({
				where: {
					id: messageId as string,
				},
				data: {
					content,
				},
				include: {
					member: {
						include: { profile: true },
					},
				},
			});
		}

		const updateKey = `chat:${channelId}:messages:update`;

		res.socket?.server?.io?.emit(updateKey, message);

		return res.status(200).json(message);
	} catch (error) {
		console.log("in message_id error", error);
		return res.status(500).json({ error: "Internal Error" });
	}
}
