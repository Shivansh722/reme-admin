import { BarChart3, Users, Package, Download, MessageSquare, Target, Lightbulb, Settings } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"
import Link from "next/link"

const menuItems = [
	{
		title: "Dashboard",
		url: "/",
		icon: BarChart3,
	},
	{
		title: "User Management",
		url: "/users",
		icon: Users,
	},
	{
		title: "Product Recommendation",
		url: "/products",
		icon: Package,
	},
	{
		title: "Data Export",
		url: "/export",
		icon: Download,
	},
	{
		title: "Prompt Management",
		url: "/prompts",
		icon: Lightbulb,
	},
]

export function AppSidebar() {
	return (
		<Sidebar>
			<SidebarHeader>
				<div className="px-4 py-2">
					<h2 className="text-lg font-semibold">Skincare Admin</h2>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Management</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{menuItems.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild>
										<Link href={item.url}>
											<item.icon />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	)
}
