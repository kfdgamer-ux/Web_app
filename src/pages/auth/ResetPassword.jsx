import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Form, Input, Typography, message } from "antd";
import { resetPasswordWithOtp } from "../../utils/api";

const { Link } = Typography;

export default function ResetPassword() {
  const navigate = useNavigate();
  const resetToken = sessionStorage.getItem("reset_token") || "";

  useEffect(() => {
    if (!resetToken) {
      navigate("/forgot-password", { replace: true });
    }
  }, [navigate, resetToken]);

  const handleResetPassword = async (values) => {
    try {
      await resetPasswordWithOtp(resetToken, values.newPassword);
      sessionStorage.removeItem("reset_token");
      sessionStorage.removeItem("reset_email");
      message.success("Đổi mật khẩu thành công");
      navigate("/login");
    } catch (err) {
      message.error(err.message || "Không thể đổi mật khẩu");
    }
  };

  return (
    <Card
      title="Đổi Mật Khẩu"
      style={{
        width: 420,
        margin: "80px auto",
      }}
    >
      <Form layout="vertical" onFinish={handleResetPassword}>
        <Form.Item
          name="newPassword"
          label="Mật khẩu mới"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu mới" },
            { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
          ]}
        >
          <Input.Password placeholder="Nhập mật khẩu mới" />
        </Form.Item>

        <Button type="primary" htmlType="submit" block>
          Đổi mật khẩu
        </Button>
      </Form>

      <div style={{ marginTop: 16 }}>
        <Link onClick={() => navigate("/login")}>Quay lại đăng nhập</Link>
      </div>
    </Card>
  );
}
