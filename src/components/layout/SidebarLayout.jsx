import { useContext } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button, Layout, Menu } from "antd";
import {
  AppstoreOutlined,
  LogoutOutlined,
  ProjectOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { AuthContext } from "../../context/AuthContextValue";

const { Sider, Content } = Layout;

export default function SidebarLayout() {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <div style={{ flex: 1, overflowY: "auto" }}>
            <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]}>
              {isAdmin && (
                <Menu.Item key="/dashboard" icon={<AppstoreOutlined />}>
                  <Link to="/dashboard">Tổng quan</Link>
                </Menu.Item>
              )}

              <Menu.Item key="/projects" icon={<ProjectOutlined />}>
                <Link to="/projects">Dự án</Link>
              </Menu.Item>

              {isAdmin && (
                <Menu.Item key="/employees" icon={<TeamOutlined />}>
                  <Link to="/employees">Nhân viên</Link>
                </Menu.Item>
              )}
            </Menu>
          </div>

          <div style={{ padding: 20, flexShrink: 0 }}>
            <Button icon={<LogoutOutlined />} danger block onClick={handleLogout}>
              Đăng xuất
            </Button>
          </div>
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
