import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Row,
  Col,
  Space,
  Tag,
  Typography,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { getProjects, addProject, deleteProject } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { createProjectTemplate, normalizeProject } from "../../utils/projectTemplate";

const { Title, Text } = Typography;

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(data.map(normalizeProject));
    } catch (err) {
      console.error("Fetch projects failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async () => {
    if (!name.trim()) return;

    await addProject({
      ...createProjectTemplate(),
      name,
    });

    await fetchData();
    setName("");
    setOpen(false);
  };

  const handleDelete = async (id) => {
    await deleteProject(id);
    setProjects((prev) => prev.filter((project) => project._id !== id));
  };

  const filtered = [...projects]
    .filter((project) => project.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const statusScoreA = a.status === "active" ? 1 : 0;
      const statusScoreB = b.status === "active" ? 1 : 0;

      if (statusScoreA !== statusScoreB) {
        return statusScoreB - statusScoreA;
      }

      return getProjectCreatedAt(b) - getProjectCreatedAt(a);
    });

  return (
    <div>
      <Title level={2}>Projects</Title>

      <Space style={{ marginBottom: 20 }}>
        <Input
          placeholder="Search..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ width: 260 }}
        />

        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Add
        </Button>
      </Space>

      {filtered.length ? (
        <Row gutter={[20, 20]}>
          {filtered.map((project) => (
            <Col key={project._id} xs={24} sm={12} lg={8}>
              <Card
                hoverable
                loading={loading}
                style={{ height: "100%" }}
                onClick={() => navigate(`/projects/${project._id}`)}
                bodyStyle={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: 180,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      marginBottom: 8,
                    }}
                  >
                    <Title level={4} style={{ margin: 0 }}>
                      {project.name}
                    </Title>

                    <Popconfirm
                      title="Delete?"
                      onPopupClick={(event) => event.stopPropagation()}
                      onConfirm={() => handleDelete(project._id)}
                    >
                      <Button
                        danger
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={(event) => event.stopPropagation()}
                      />
                    </Popconfirm>
                  </div>

                  <Tag color={project.status === "active" ? "green" : "default"}>
                    {project.status === "active" ? "triển khai" : "hoàn thành"}
                  </Tag>
                  <br />
                  <Text type="secondary">
                    {project.members?.length ?? 0} members
                  </Text>
                </div>

                <div style={{ marginTop: 20 }}>
                  <Text type="secondary">Click card to open project</Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty
          description={loading ? "Loading projects..." : "No projects found"}
          style={{ marginTop: 40 }}
        />
      )}

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleAdd}
        title="Add Project"
      >
        <Input
          placeholder="Project Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </Modal>
    </div>
  );
}
  const getProjectCreatedAt = (project) => {
    const objectIdPrefix = project?._id?.toString?.().slice(0, 8);
    if (!objectIdPrefix) return 0;

    return parseInt(objectIdPrefix, 16) * 1000;
  };
