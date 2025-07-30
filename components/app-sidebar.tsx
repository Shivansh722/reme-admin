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
		title: "ダッシュボード", // Dashboard
		url: "/",
		icon: BarChart3,
	},
	{
		title: "ユーザー管理", // User Management
		url: "/users",
		icon: Users,
	},
	{
		title: "商品レコメンド", // Product Recommendation
		url: "/products",
		icon: Package,
	},
	{
		title: "データエクスポート", // Data Export
		url: "/export",
		icon: Download,
	},
	{
		title: "プロンプト管理", // Prompt Management
		url: "/prompts",
		icon: Lightbulb,
	},
]

export function AppSidebar() {
	return (
		<Sidebar>
			<SidebarHeader>
				<div className="px-4 py-2">
					<h2 className="text-lg font-semibold">スキンケア管理画面</h2>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>管理</SidebarGroupLabel>
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
