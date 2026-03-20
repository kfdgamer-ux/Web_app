import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Avatar, Button, Card, Col, Form, Input, List, Row, Typography, message } from "antd";
import { getEmployees, getProjects, updateEmployee } from "../../utils/api";

const { Title, Text } = Typography;

export default function EmployeeDetail() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [projects, setProjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      const employees = await getEmployees();
      const found = employees.find((item) => item._id === id);
      setEmployee(found ?? null);
      form.setFieldsValue(found ?? {});

      const allProjects = await getProjects();
      const joined = allProjects.filter((project) =>
        project.members?.some((member) => member.employeeId === id),
      );

      setProjects(joined);
    };

    fetchData();
  }, [form, id]);

  const onFinish = async (values) => {
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("name", values.name || "");
      formData.append("email", values.email || "");
      formData.append("phone", values.phone || "");
      formData.append("address", values.address || "");
      formData.append("role", values.role || "");

      const updated = await updateEmployee(id, formData);
      setEmployee(updated);
      form.setFieldsValue(updated);
      message.success("Cập nhật nhân viên thành công");
    } catch (err) {
      message.error(err.message || "Không thể cập nhật nhân viên");
    } finally {
      setSaving(false);
    }
  };

  if (!employee) return <div>Đang tải...</div>;

  return (
    <Row gutter={20}>
      <Col span={16}>
        <Card>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <Avatar src={employee.avatar} size={120}>
              {employee.name?.charAt(0)}
            </Avatar>

            <Title level={3}>{employee.name}</Title>
          </div>

          <Form form={form} layout="vertical" onFinish={onFinish}>
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

            <Button type="primary" htmlType="submit" loading={saving}>
              Cập nhật
            </Button>
          </Form>
        </Card>
      </Col>

      <Col span={8}>
        <Card title="Dự án tham gia">
          <List
            dataSource={projects}
            renderItem={(item) => (
              <List.Item>
                <Text>{item.name}</Text>
              </List.Item>
            )}
          />
        </Card>
      </Col>
    </Row>
  );
}
