import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { MemberRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
	try {
		
		let { imageUrl, serverName } = await req.json();
		if (!imageUrl) {
			imageUrl =
				"https://utfs.io/f/8f55ac64-b317-493f-b1b4-f5dbb14adfd5-s1g60s.jpg";
		}
		
		const profile = await currentProfile();
		if (!profile) return new NextResponse("Unauthorized", { status: 401 });

		const server = await db.server.create({
			data: {
				imageUrl,
				name: serverName,
				profileId: profile.id,
				inviteCode: uuidv4(),
				channels: {
					create: [{ name: "general", profileId: profile.id }],
				},
				members: {
					create: [{ profileId: profile.id, role: MemberRole.ADMIN }],
				},
			},
		});
		
		return NextResponse.json(server);
	} catch (error) {
		return new NextResponse("Internal Error", { status: 500 });
	}
}
