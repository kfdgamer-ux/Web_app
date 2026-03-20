import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Form, Input, message, Typography } from "antd";
import { AuthContext } from "../../context/AuthContextValue";
import { login as apiLogin } from "../../utils/api";

const { Link } = Typography;

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const data = await apiLogin(values.username, values.password);
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err) {
      message.error(err.message || "Đăng nhập thất bại");
    }
  };

  return (
    <Card
      title="Đăng Nhập Quản Lý Dự Án"
      style={{
        width: 350,
        margin: "120px auto",
      }}
    >
      <Form onFinish={onFinish}>
        <Form.Item name="username">
          <Input placeholder="Tên đăng nhập" />
        </Form.Item>

        <Form.Item name="password">
          <Input.Password placeholder="Mật khẩu" />
        </Form.Item>

        <Button type="primary" htmlType="submit" block>
          Đăng nhập
        </Button>
      </Form>

      <div style={{ marginTop: 16, textAlign: "right" }}>
        <Link onClick={() => navigate("/forgot-password")}>Quên mật khẩu?</Link>
      </div>
    </Card>
  );
}
