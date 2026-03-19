import { Form, Input, Button, Upload, Avatar } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { addEmployee } from "../../utils/api";
import { useState } from "react";

export default function AddEmployee() {

  const navigate = useNavigate();
  const [file, setFile] = useState(null);       // 👈 lưu file
  const [preview, setPreview] = useState("");   // 👈 preview ảnh

  // preview ảnh
  const handlePreview = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const onFinish = async (values) => {

    const formData = new FormData();

    formData.append("name", values.name || "");
    formData.append("email", values.email || "");
    formData.append("phone", values.phone || "");
    formData.append("address", values.address || "");
    formData.append("role", values.role || "");

    if (file) {
      formData.append("avatar", file); 
    }

    await addEmployee(formData);

    navigate("/employees");
  };

  return (

    <Form onFinish={onFinish} layout="vertical">

      <Form.Item label="Avatar">
        <Upload
          beforeUpload={(file) => {
            setFile(file);         // lưu file thật
            handlePreview(file);   // preview
            return false;          // không upload auto
          }}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>
            Upload Avatar
          </Button>
        </Upload>

        {preview && (
          <div style={{ marginTop: 10 }}>
            <Avatar src={preview} size={80} />
          </div>
        )}
      </Form.Item>

      <Form.Item name="name" label="Name">
        <Input />
      </Form.Item>

      <Form.Item name="email" label="Email">
        <Input />
      </Form.Item>

      <Form.Item name="phone" label="Phone">
        <Input />
      </Form.Item>

      <Form.Item name="address" label="Address">
        <Input />
      </Form.Item>

      <Form.Item name="role" label="Role">
        <Input />
      </Form.Item>

      <Button type="primary" htmlType="submit">
        Add Employee
      </Button>

    </Form>
  );
}