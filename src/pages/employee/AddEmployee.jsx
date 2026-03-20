import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, Button, Form, Input, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { addEmployee } from "../../utils/api";

export default function AddEmployee() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  const handlePreview = (selectedFile) => {
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const onFinish = async (values) => {
    const formData = new FormData();

    formData.append("name", values.name || "");
    formData.append("email", values.email || "");
    formData.append("phone", values.phone || "");
    formData.append("address", values.address || "");
    formData.append("role", values.role || "");
    formData.append("username", values.username || "");
    formData.append("password", values.password || "");

    if (file) {
      formData.append("avatar", file);
    }

    await addEmployee(formData);
    navigate("/employees");
  };

  return (
    <Form onFinish={onFinish} layout="vertical">
      <Form.Item label="Ảnh đại diện">
        <Upload
          beforeUpload={(selectedFile) => {
            setFile(selectedFile);
            handlePreview(selectedFile);
            return false;
          }}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>Tải ảnh đại diện</Button>
        </Upload>

        {preview && (
          <div style={{ marginTop: 10 }}>
            <Avatar src={preview} size={80} />
          </div>
        )}
      </Form.Item>

      <Form.Item name="name" label="Tên">
        <Input />
      </Form.Item>

      <Form.Item name="email" label="Email">
        <Input />
      </Form.Item>

      <Form.Item name="phone" label="Số điện thoại">
        <Input />
      </Form.Item>

      <Form.Item name="address" label="Địa chỉ">
        <Input />
      </Form.Item>

      <Form.Item name="role" label="Vai trò">
        <Input />
      </Form.Item>

      <Form.Item
        name="username"
        label="Tên đăng nhập"
        rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="password"
        label="Mật khẩu"
        rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
      >
        <Input.Password />
      </Form.Item>

      <Button type="primary" htmlType="submit">
        Thêm nhân viên
      </Button>
    </Form>
  );
}
