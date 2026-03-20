import { useCallback, useContext, useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Row,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { addProject, deleteProject, getProjects } from "../../utils/api";
import { AuthContext } from "../../context/AuthContextValue";
import { createProjectTemplate, normalizeProject } from "../../utils/projectTemplate";
import { exportProjectsReportToExcel } from "../../utils/projectExport";

const { Title, Text } = Typography;

const getProjectCreatedAt = (project) => {
  const objectIdPrefix = project?._id?.toString?.().slice(0, 8);
  if (!objectIdPrefix) return 0;

  return parseInt(objectIdPrefix, 16) * 1000;
};

const ACTIVE_PROJECT_BANNERS = [
  {
    background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
    boxShadow: "0 10px 24px rgba(20, 184, 166, 0.24)",
  },
  {
    background: "linear-gradient(135deg, #1d4ed8 0%, #60a5fa 100%)",
    boxShadow: "0 10px 24px rgba(59, 130, 246, 0.24)",
  },
  {
    background: "linear-gradient(135deg, #be123c 0%, #fb7185 100%)",
    boxShadow: "0 10px 24px rgba(244, 63, 94, 0.24)",
  },
  {
    background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
    boxShadow: "0 10px 24px rgba(139, 92, 246, 0.24)",
  },
  {
    background: "linear-gradient(135deg, #c2410c 0%, #fb923c 100%)",
    boxShadow: "0 10px 24px rgba(249, 115, 22, 0.24)",
  },
];

const getProjectBannerStyle = (project) => {
  if (project.status !== "active") {
    return {
      background: "linear-gradient(135deg, #475569 0%, #94a3b8 100%)",
      boxShadow: "0 10px 24px rgba(148, 163, 184, 0.24)",
    };
  }

  const projectId = project._id?.toString?.() ?? project.name ?? "";
  const hash = [...projectId].reduce((total, char) => total + char.charCodeAt(0), 0);
  return ACTIVE_PROJECT_BANNERS[hash % ACTIVE_PROJECT_BANNERS.length];
};

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === "admin";

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

  const openExportModal = () => {
    setSelectedProjectIds([]);
    setExportOpen(true);
  };

  const handleExportSelected = () => {
    const selectedProjects = projects.filter((project) =>
      selectedProjectIds.includes(project._id),
    );

    if (!selectedProjects.length) {
      message.warning("Hãy chọn ít nhất một dự án để xuất báo cáo");
      return;
    }

    exportProjectsReportToExcel(selectedProjects);
    setExportOpen(false);
  };

  const toggleProjectSelection = (projectId) => {
    setSelectedProjectIds((current) =>
      current.includes(projectId)
        ? current.filter((id) => id !== projectId)
        : [...current, projectId],
    );
  };

  return (
    <div>
      <Title level={2}>Dự án</Title>

      <Space style={{ marginBottom: 20 }}>
        <Input
          placeholder="Tìm kiếm dự án..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ width: 260 }}
        />

        <Button onClick={openExportModal}>Xuất báo cáo</Button>

        {isAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            Thêm
          </Button>
        )}
      </Space>

      {filtered.length ? (
        <Row gutter={[20, 20]}>
          {filtered.map((project) => (
            <Col key={project._id} xs={24} sm={12} lg={8}>
              <Card
                hoverable
                loading={loading}
                style={{ height: "100%", overflow: "hidden", width: "90%", margin: "0 auto" }}
                onClick={() => navigate(`/projects/${project._id}`)}
                bodyStyle={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: 150,
                  padding: 18,
                }}
              >
                <div>
                  <div
                    style={{
                      ...getProjectBannerStyle(project),
                      marginBottom: 16,
                      marginTop: -24,
                      marginLeft: -24,
                      marginRight: -24,
                      padding: "14px 18px 18px",
                    }}
                  >
                    <Text
                      style={{
                        color: "#ffffff",
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: 1.2,
                        textTransform: "uppercase",
                      }}
                    >
                      {project.status === "active"
                        ? "Dự án đang triển khai"
                        : "Dự án đã hoàn thành"}
                    </Text>
                  </div>

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

                    {isAdmin && (
                      <Popconfirm
                        title="Xóa dự án?"
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
                    )}
                  </div>

                  <Tag color={project.status === "active" ? "green" : "default"}>
                    {project.status === "active" ? "Triển khai" : "Hoàn thành"}
                  </Tag>
                  <br />
                  <Text type="secondary">{project.members?.length ?? 0} thành viên</Text>
                </div>

              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty
          description={loading ? "Đang tải dự án..." : "Không tìm thấy dự án"}
          style={{ marginTop: 40 }}
        />
      )}

      {isAdmin && (
        <Modal
          open={open}
          onCancel={() => setOpen(false)}
          onOk={handleAdd}
          title="Thêm dự án"
        >
          <Input
            placeholder="Tên dự án"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Modal>
      )}

      <Modal
        open={exportOpen}
        onCancel={() => setExportOpen(false)}
        onOk={handleExportSelected}
        okText="Xuất Excel"
        title="Chọn dự án để xuất báo cáo"
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Space>
            <Button onClick={() => setSelectedProjectIds(filtered.map((project) => project._id))}>
              Chọn tất cả
            </Button>
            <Button onClick={() => setSelectedProjectIds([])}>Bỏ chọn</Button>
          </Space>

          {filtered.length ? (
            <div style={{ maxHeight: 320, overflowY: "auto", paddingRight: 4 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                {filtered.map((project) => {
                  const selected = selectedProjectIds.includes(project._id);

                  return (
                    <button
                      key={project._id}
                      type="button"
                      onClick={() => toggleProjectSelection(project._id)}
                      style={{
                        width: "100%",
                        minHeight: 88,
                        textAlign: "left",
                        borderRadius: 14,
                        padding: "12px 10px",
                        border: selected ? "2px solid #1677ff" : "1px solid #d9d9d9",
                        background: selected ? "#e6f4ff" : "#ffffff",
                        boxShadow: selected ? "0 10px 20px rgba(22, 119, 255, 0.12)" : "none",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "flex-start",
                      }}
                    >
                      <Space
                        direction="vertical"
                        size={6}
                        style={{ width: "100%", pointerEvents: "none" }}
                      >
                        <Text
                          strong
                          style={{
                            color: selected ? "#0958d9" : "inherit",
                            lineHeight: 1.4,
                          }}
                        >
                          {project.name}
                        </Text>
                        <Tag color={project.status === "active" ? "green" : "default"}>
                          {project.status === "active" ? "Đang triển khai" : "Hoàn thành"}
                        </Tag>
                      </Space>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <Empty description="Không có dự án để xuất" />
          )}
        </Space>
      </Modal>
    </div>
  );
}
