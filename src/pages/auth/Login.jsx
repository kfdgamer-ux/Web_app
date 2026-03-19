import { Card, Form, Input, Button, message } from "antd";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContextValue";
import { useNavigate } from "react-router-dom";
import { login as apiLogin } from "../../utils/api";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const data = await apiLogin(values.username, values.password);
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err) {
      message.error(err.message || "Login failed");
    }
  };



  return (

    <Card
      title="Project Manager Login"
      style={{
        width: 350,
        margin: "120px auto"
      }}
    >

      <Form onFinish={onFinish}>

        <Form.Item name="username">
          <Input placeholder="username" />
        </Form.Item>

        <Form.Item name="password">
          <Input.Password placeholder="password" />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          block
        >
          Login
        </Button>

      </Form>

    </Card>
  );
}
