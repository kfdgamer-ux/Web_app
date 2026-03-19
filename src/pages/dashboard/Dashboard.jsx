import { useEffect, useState } from "react";
import { Card, Col, Empty, Progress, Row, Space, Typography } from "antd";
import { getEmployees, getProjects } from "../../utils/api";

const { Title, Text } = Typography;

const COLORS = ["#0f766e", "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#059669"];

function MiniBarChart({ title, items, loading, emptyText }) {
  const maxValue = Math.max(1, ...items.map((item) => item.value));

  return (
    <Card title={title} loading={loading} style={{ height: "100%" }}>
      {items.length ? (
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {items.map((item, index) => (
            <div key={item.label}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <Text>{item.label}</Text>
                <Text strong>{item.value}</Text>
              </div>
              <div
                style={{
                  background: "#e5e7eb",
                  borderRadius: 999,
                  height: 12,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    height: "100%",
                    background: COLORS[index % COLORS.length],
                  }}
                />
              </div>
            </div>
          ))}
        </Space>
      ) : (
        <Empty description={emptyText} />
      )}
    </Card>
  );
}

function DonutChartCard({ title, value, total, color, loading }) {
  const percent = total ? Math.min(100, Math.round((value / total) * 100)) : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <Card loading={loading} style={{ height: "100%" }}>
      <Space
        direction="vertical"
        align="center"
        style={{ width: "100%", justifyContent: "center" }}
        size="small"
      >
        <Text type="secondary">{title}</Text>
        <svg width="150" height="150" viewBox="0 0 150 150">
          <circle cx="75" cy="75" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="14" />
          <circle
            cx="75"
            cy="75"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 75 75)"
          />
          <text x="75" y="69" textAnchor="middle" fontSize="26" fontWeight="700" fill="#111827">
            {value}
          </text>
          <text x="75" y="92" textAnchor="middle" fontSize="13" fill="#6b7280">
            {percent}%
          </text>
        </svg>
      </Space>
    </Card>
  );
}

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [projectData, employeeData] = await Promise.all([getProjects(), getEmployees()]);
        setProjects(projectData);
        setEmployees(employeeData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalAssignments = projects.reduce(
    (sum, project) => sum + (project.members?.length ?? 0),
    0,
  );
  const activeProjects = projects.filter((project) => project.status !== "inactive").length;
  const inactiveProjects = projects.length - activeProjects;

  const totalCapacity = Math.max(1, employees.length * Math.max(1, projects.length || 1));

  const projectMemberData = [...projects]
    .sort((a, b) => (b.members?.length ?? 0) - (a.members?.length ?? 0))
    .slice(0, 5)
    .map((project) => ({
      label: project.name || "Dự án chưa đặt tên",
      value: project.members?.length ?? 0,
    }));

  const statusData = [
    { label: "Dự án đang hoạt động", value: activeProjects },
    { label: "Dự án ngưng hoạt động", value: inactiveProjects },
  ];

  const roleMap = employees.reduce((acc, employee) => {
    const role = employee.role || "Chưa phân vai trò";
    acc[role] = (acc[role] ?? 0) + 1;
    return acc;
  }, {});

  const roleData = Object.entries(roleMap)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div>
        <Title level={2} style={{ marginBottom: 4 }}>
          Tổng Quan
        </Title>
        <Text type="secondary">
          Tổng hợp nhanh bằng biểu đồ cho dự án và nhân sự.
        </Text>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} md={8}>
          <DonutChartCard
            title="Tổng Dự Án"
            value={projects.length}
            total={Math.max(1, projects.length + employees.length)}
            color="#2563eb"
            loading={loading}
          />
        </Col>

        <Col xs={24} md={8}>
          <DonutChartCard
            title="Tổng Nhân Viên"
            value={employees.length}
            total={Math.max(1, projects.length + employees.length)}
            color="#0f766e"
            loading={loading}
          />
        </Col>

        <Col xs={24} md={8}>
          <Card loading={loading} style={{ height: "100%" }}>
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <Text type="secondary">Lượt Phân Công</Text>
              <Title level={2} style={{ margin: 0 }}>
                {totalAssignments}
              </Title>
              <Progress
                percent={Math.min(100, Math.round((totalAssignments / totalCapacity) * 100))}
                strokeColor="#d97706"
                trailColor="#e5e7eb"
              />
              <Text type="secondary">
                Mật độ phân công trên toàn bộ nhân sự và dự án hiện tại.
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={14}>
          <MiniBarChart
            title="Dự Án Theo Số Thành Viên"
            items={projectMemberData}
            loading={loading}
            emptyText="Chưa có dự án"
          />
        </Col>

        <Col xs={24} lg={10}>
          <MiniBarChart
            title="Trạng Thái Dự Án"
            items={statusData}
            loading={loading}
            emptyText="Chưa có dự án"
          />
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24}>
          <MiniBarChart
            title="Nhân Viên Theo Vai Trò"
            items={roleData}
            loading={loading}
            emptyText="Chưa có nhân viên"
          />
        </Col>
      </Row>
    </Space>
  );
}
