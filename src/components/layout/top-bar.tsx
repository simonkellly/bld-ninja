import { connect, reset, CubeStore } from "@/lib/cube/smart-cube";
import type { NavbarProps } from "@heroui/react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  Link,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { useTheme } from "@heroui/use-theme";
import { useLocation } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { Bluetooth, BluetoothConnected, Moon, Sun, RotateCcw, Power } from "lucide-react";

function ThemeButton() {
  const { theme, setTheme } = useTheme();

  const Icon = theme === "dark" ? Sun : Moon;

  return (
      <Button radius="full" isIconOnly variant="flat" onPress={() => setTheme(theme === "dark" ? "light" : "dark")}>
        <Icon className="h-4 w-4" />
      </Button>
  );
}

function CubeButton() {
  const cube = useStore(CubeStore, state => state.cube);
  const Icon = cube ? BluetoothConnected : Bluetooth;

  if (cube) {
    return (
      <NavbarItem className="ml-2 !flex gap-2">
        <ThemeButton />
        <Dropdown>
          <DropdownTrigger>
            <Button radius="full" variant="flat">
              <Icon className="h-4 w-4" />
              {cube.name}
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Cube actions">
            <DropdownItem 
              key="reset" 
              startContent={<RotateCcw className="h-4 w-4" />}
              onPress={() => {
                reset();
              }}
            >
              Reset State
            </DropdownItem>
            <DropdownItem 
              key="disconnect" 
              className="text-danger" 
              color="danger"
              startContent={<Power className="h-4 w-4" />}
              onPress={connect}
            >
              Disconnect
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </NavbarItem>
    );
  }

  return (
    <NavbarItem className="ml-2 !flex gap-2">
      <ThemeButton />
      <Button radius="full" variant="flat" onPress={connect}>
        <Icon className="h-4 w-4" />
        Disconnected
      </Button>
    </NavbarItem>
  );
}

const navLinks = [
  { name: 'Timer', path: '/timer' },
  { name: 'Algs', path: '/algs' }
] as const;

export default function Component(props: NavbarProps) {
  const location = useLocation();

  return (
    <Navbar
      {...props}
      classNames={{
        base: "py-4 backdrop-filter-none bg-transparent",
        wrapper: "px-0 w-full justify-center bg-transparent",
        item: "hidden md:flex",
      }}
      height="54px"
    >
      <NavbarContent
        className="gap-4 rounded-full border-small border-default-200/20 bg-background/60 px-2 shadow-medium backdrop-blur-md backdrop-saturate-150 dark:bg-default-100/50"
        justify="center"
      >
        <NavbarBrand className="mr-2 w-auto max-w-fit">
          <span className="ml-2 font-medium">BLD Ninja</span>
        </NavbarBrand>
        {navLinks.map(page => {
          const isActive = location.pathname === page.path;
          if (isActive) return (
            <NavbarItem isActive key={page.name}>
              <Link aria-current="page" color="foreground" href={page.path} size="sm">
                {page.name}
              </Link>
            </NavbarItem>
          );

          return (
            <NavbarItem key={page.name}>
              <Link className="text-default-500" href={page.path} size="sm">
                {page.name}
              </Link>
            </NavbarItem>
          );
        })}
        <CubeButton />
      </NavbarContent>
    </Navbar>
  );
}