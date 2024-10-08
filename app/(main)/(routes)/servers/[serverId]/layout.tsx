import ServerSidebar from "@/components/server/ServerSidebar";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { redirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

const ServerIdLayout = async ({
	children,
	params,
}: {
	children: React.ReactNode;
	params: { serverId: string };
	}) => {
	
	const profile = await currentProfile();
	if (!profile) redirectToSignIn();

	const server = await db.server.findUnique({
		where: {
			id: params?.serverId,
			members: {
				some: {
					profileId: profile?.id,
				},
			},
		},
	});

	if (!server) redirect("/");
		
	return (
		<div className="h-full">
			<div className="hidden md:flex fixed inset-y-0 flex-col w-60  h-full z-20">
				<ServerSidebar serverId={params.serverId} />
			</div>
			<main className="h-full md:pl-60">{children}</main>
		</div>
	);
};

export default ServerIdLayout;
