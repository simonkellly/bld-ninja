import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from "@/lib/utils";
import { routeTree } from "@/routeTree.gen";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { Link, ParseRoute } from "@tanstack/react-router";
import { Box, Home, LayoutDashboard, LifeBuoy, LucideProps, SquareUser } from "lucide-react";

type ValidRoutes = ParseRoute<typeof routeTree>['fullPath'];

function SidebarButton({
  label,
  icon,
  link,
  className,
}: {
  label: string;
  icon: React.ForwardRefExoticComponent<LucideProps>;
  link?: ValidRoutes;
  className?: string;
}) {
  const buttonClass = cn('rounded-lg', className);
  const Icon = icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link to={link} disabled={!link}>
          <Button
            variant="ghost"
            size="icon"
            className={buttonClass}
            aria-label={label}
          >
            <Icon className="size-5" />
          </Button>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={5}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}


export default function Sidebar() {
  return (
    <aside className="inset-y fixed  left-0 z-20 flex h-full flex-col border-r">
      <div className="border-b p-2">
        <a href="https://github.com/simonkellly/bld-ninja">
          <Button variant="outline" size="icon" aria-label="Home">
            <SiGithub className="size-5 fill-foreground" />
          </Button>
        </a>
      </div>
      <nav className="grid gap-1 p-2">
        <SidebarButton label="Home" icon={Home} link="/" />
        <SidebarButton
          label="Dashboard"
          icon={LayoutDashboard}
          link="/dashboard"
        />
        <SidebarButton label="Cube" icon={Box} link="/twisty" />
      </nav>
      <nav className="mt-auto grid gap-1 p-2">
        <SidebarButton label="Help" icon={LifeBuoy} className="mt-auto" />
        <SidebarButton
          label="Account"
          icon={SquareUser}
          className="mt-auto"
        />
      </nav>
    </aside>
  );
}