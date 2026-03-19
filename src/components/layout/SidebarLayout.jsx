import { Layout, Menu, Button } from "antd";
import {
  AppstoreOutlined,
  ProjectOutlined,
  TeamOutlined,
  LogoutOutlined
} from "@ant-design/icons";

import {
  Link,
  Outlet,
  useNavigate,
  useLocation
} from "react-router-dom";

import { useContext } from "react";
import { AuthContext } from "../../context/AuthContextValue";

const { Sider, Content } = Layout;

export default function SidebarLayout() {

  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (

    <Layout style={{ minHeight: "100vh" }}>

      <Sider breakpoint="lg" collapsedWidth="0">

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
        >

          <Menu.Item
            key="/dashboard"
            icon={<AppstoreOutlined />}
          >
            <Link to="/dashboard">Dashboard</Link>
          </Menu.Item>

          <Menu.Item
            key="/projects"
            icon={<ProjectOutlined />}
          >
            <Link to="/projects">Projects</Link>
          </Menu.Item>

          <Menu.Item
            key="/employees"
            icon={<TeamOutlined />}
          >
            <Link to="/employees">Employees</Link>
          </Menu.Item>

        </Menu>

        <div style={{ padding: 20 }}>

          <Button
            icon={<LogoutOutlined />}
            danger
            block
            onClick={handleLogout}
          >
            Logout
          </Button>

        </div>

      </Sider>

      <Layout>

        <Content style={{ padding: 20 }}>
          <Outlet />
        </Content>

      </Layout>

    </Layout>
  );
}
