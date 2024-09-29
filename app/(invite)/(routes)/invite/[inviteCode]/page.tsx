import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { initialProfile } from "@/lib/initial-profile";
import { redirect } from "next/navigation";

const InvitePage = async ({ params }: { params: { inviteCode: string } }) => {
	const profile = await initialProfile()

	if (!profile) {
		redirect("/sign-in");
	}
	console.log(profile);

	if (!params.inviteCode) redirect("/");

	const existingServer = await db.server.findFirst({
		where: {
			inviteCode: params.inviteCode,
			members: {
				some: {
					profileId: profile?.id,
				},
			},
		},
	});

	if (existingServer) {
		redirect(`/servers/${existingServer.id}`);
	}

	const server = await db.server.update({
		where: {
			inviteCode: params.inviteCode,
		},
		data: {
			members: {
				create: [{ profileId: profile?.id }],
			},
		},
	});

	if (server) {
		redirect(`/servers/${server.id}`);
	}

	return <div>Hello to invite page.</div>;
};

export default InvitePage;
