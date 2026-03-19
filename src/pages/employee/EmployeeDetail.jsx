import { useParams } from "react-router-dom";
import { getEmployees, updateEmployee, getProjects } from "../../utils/api";
import { Avatar, Typography, Form, Input, Button, Card, List, Row, Col } from "antd";
import { useEffect, useState } from "react";

const { Title, Text } = Typography;

export default function EmployeeDetail() {

  const { id } = useParams();

  const [employee, setEmployee] = useState(null);
  const [projects, setProjects] = useState([]);

  const [form] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      const employees = await getEmployees();
      const found = employees.find(e => e._id === id);
      setEmployee(found);

      const allProjects = await getProjects();

      const joined = allProjects.filter(p =>
        p.members?.some(m => m.employeeId === id)
      );

      setProjects(joined);
    };

    fetchData();
  }, [id]);

  const onFinish = async (values) => {

    const updated = await updateEmployee(id, values);
    setEmployee(updated);
  };

  if (!employee) return <div>Loading...</div>;

  return (

    <Row gutter={20}>

      {/* LEFT */}
      <Col span={16}>

        <Card>

          <div style={{ textAlign: "center", marginBottom: 20 }}>

            <Avatar src={employee.avatar} size={120}>
              {employee.name?.charAt(0)}
            </Avatar>

            <Title level={3}>{employee.name}</Title>

          </div>

          <Form
            form={form}
            layout="vertical"
            initialValues={employee}
            onFinish={onFinish}
          >

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
              Update
            </Button>

          </Form>

        </Card>

      </Col>

      {/* RIGHT */}
      <Col span={8}>

        <Card title="Projects Joined">

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