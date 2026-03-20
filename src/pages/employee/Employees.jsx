import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, Button, Input, Popconfirm, Space, Table, Typography } from "antd";
import { deleteEmployee, getEmployees } from "../../utils/api";

const { Title } = Typography;

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const data = await getEmployees();
      setEmployees(data);
    };

    fetchData();
  }, []);

  const handleDelete = async (id) => {
    await deleteEmployee(id);
    setEmployees((prev) => prev.filter((employee) => employee._id !== id));
  };

  const filtered = employees.filter((employee) =>
    employee.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const columns = [
    {
      title: "Ảnh",
      render: (_, record) => <Avatar src={record.avatar}>{record.name?.charAt(0)}</Avatar>,
    },
    {
      title: "Tên",
      dataIndex: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Vai trò",
      dataIndex: "role",
    },
    {
      title: "Thao tác",
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/employees/${record._id}`)}>
            Chi tiết
          </Button>

          <Popconfirm title="Xóa nhân viên này?" onConfirm={() => handleDelete(record._id)}>
            <Button danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <Title level={3}>Nhân viên</Title>

        <Button type="primary" onClick={() => navigate("/employees/add")}>
          Thêm nhân viên
        </Button>
      </Space>

      <Input
        placeholder="Tìm kiếm nhân viên..."
        style={{ maxWidth: 300, marginBottom: 20 }}
        onChange={(event) => setSearch(event.target.value)}
      />

      <Table rowKey="_id" columns={columns} dataSource={filtered} pagination={false} />
    </div>
  );
}
