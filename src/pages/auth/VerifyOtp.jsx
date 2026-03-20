import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Button, Card, Form, Input, Typography, message } from "antd";
import { verifyPasswordOtp } from "../../utils/api";

const { Text, Link } = Typography;

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || sessionStorage.getItem("reset_email") || "";
  const previewMode = Boolean(location.state?.previewMode);
  const previewOtp = location.state?.previewOtp || "";

  useEffect(() => {
    if (email) {
      sessionStorage.setItem("reset_email", email);
    }
  }, [email]);

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password", { replace: true });
    }
  }, [email, navigate]);

  const handleVerifyOtp = async (values) => {
    try {
      const result = await verifyPasswordOtp(email, values.otp);
      sessionStorage.setItem("reset_token", result.resetToken);
      navigate("/reset-password");
      message.success("Xác thực OTP thành công");
    } catch (err) {
      message.error(err.message || "OTP không hợp lệ");
    }
  };

  return (
    <Card
      title="Xác Thực OTP"
      style={{
        width: 420,
        margin: "80px auto",
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <Text>
          Mã OTP đã được gửi đến: <strong>{email}</strong>
        </Text>
      </div>

      {previewMode && previewOtp && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Email chưa được cấu hình"
          description={
            <span>
              OTP xem thử để test local: <strong>{previewOtp}</strong>
            </span>
          }
        />
      )}

      <Form layout="vertical" onFinish={handleVerifyOtp}>
        <Form.Item
          name="otp"
          label="Mã OTP"
          rules={[{ required: true, message: "Vui lòng nhập mã OTP" }]}
        >
          <Input placeholder="Nhập mã OTP gồm 6 số" />
        </Form.Item>

        <Button type="primary" htmlType="submit" block>
          Xác thực OTP
        </Button>
      </Form>

      <div style={{ marginTop: 16 }}>
        <Link onClick={() => navigate("/forgot-password")}>Gửi lại OTP</Link>
      </div>
    </Card>
  );
}
