import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CloseOutlined, CommentOutlined, DownloadOutlined, SendOutlined } from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { getEmployees, getProjects, updateProject } from "../../utils/api";
import { AuthContext } from "../../context/AuthContextValue";
import { exportProjectToExcel } from "../../utils/projectExport";
import {
  createProjectTemplate,
  createSectionColumn,
  createSectionRow,
  normalizeProject,
  SECTION_CONFIG,
} from "../../utils/projectTemplate";

const { Title, Text } = Typography;
const EMPTY_VALUE = "-";

const formatDateTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === "admin";

  const [project, setProject] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [memberToolboxOpen, setMemberToolboxOpen] = useState(false);
  const [overviewDraft, setOverviewDraft] = useState(createProjectTemplate());
  const [sectionEditor, setSectionEditor] = useState({
    open: false,
    sectionKey: "",
    rowId: null,
    draftValues: {},
  });
  const [sectionConfigEditor, setSectionConfigEditor] = useState({
    open: false,
    sectionKey: "",
    title: "",
    subtitle: "",
    columns: [],
  });
  const [assignmentEditor, setAssignmentEditor] = useState({
    open: false,
    employeeId: "",
    employeeName: "",
    assignment: "",
    mode: "add",
  });
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const [projects, emps] = await Promise.all([getProjects(), getEmployees()]);
      const foundProject = projects.find((item) => item._id === id);
      setProject(foundProject ? normalizeProject(foundProject) : null);
      setEmployees(emps);
    };

    fetchData();
  }, [id]);

  if (!project) {
    return <h2>Đang tải...</h2>;
  }

  const members = project.members ?? [];
  const currentEmployee = employees.find((item) => item._id === user?.employeeId);
  const currentChatAuthor = isAdmin
    ? user?.username || "admin"
    : currentEmployee?.name || user?.username || "Nhân viên";

  const memberEmployees = members
    .map((member) => {
      const employee = employees.find((item) => item._id === member.employeeId);

      if (!employee) {
        return {
          _id: member.employeeId,
          name:
            member.employeeId === user?.employeeId
              ? user?.username || "Nhân viên"
              : "Thành viên dự án",
          role: "",
          avatar: "",
          assignment: member.assignment,
        };
      }

      return {
        ...employee,
        assignment: member.assignment,
      };
    })
    .filter(Boolean);

  const availableEmployees = employees
    .filter((employee) => !members.some((member) => member.employeeId === employee._id))
    .filter((employee) => employee.name?.toLowerCase().includes(search.toLowerCase()));

  const chatMessages = project.chatMessages?.length
    ? project.chatMessages
    : [
        {
          id: "system-welcome",
          author: "Hệ thống",
          text: "Xin chào, đây là hộp chat nhanh cho người dùng trong trang chi tiết dự án.",
          createdAt: new Date().toISOString(),
        },
      ];

  const activityLogs = [...(project.activityLogs ?? [])].reverse();
  const availableSectionTemplates = SECTION_CONFIG.filter(
    (sectionMeta) => !(project[sectionMeta.key]?.columns?.length > 0),
  );
  const createdSections = SECTION_CONFIG.filter(
    (sectionMeta) => project[sectionMeta.key]?.columns?.length > 0,
  );

  const findEmployeeByActorName = (actorName) => {
    if (!actorName) return null;
    return employees.find((employee) => employee.name === actorName) ?? null;
  };

  const saveProject = async (nextProject, successMessage = "Cập nhật dự án thành công") => {
    setSaving(true);

    try {
      const updatedProject = await updateProject(id, nextProject);
      const normalized = normalizeProject(updatedProject);
      setProject(normalized);
      message.success(successMessage);
      return normalized;
    } finally {
      setSaving(false);
    }
  };

  const updateSection = async (sectionKey, nextSection, successMessage) => {
    await saveProject(
      {
        ...project,
        [sectionKey]: nextSection,
      },
      successMessage,
    );
  };

  const openOverviewEditor = () => {
    setOverviewDraft({
      name: project.name,
      status: project.status,
      siteName: project.siteName,
      code: project.code,
      date: project.date,
      formNo: project.formNo,
      revision: project.revision,
      desc: project.desc,
    });
    setOverviewOpen(true);
  };

  const submitOverviewUpdate = async () => {
    await saveProject(
      {
        ...project,
        ...overviewDraft,
      },
      "Cập nhật thông tin dự án thành công",
    );
    setOverviewOpen(false);
  };

  const openSectionEditor = (sectionKey, rowId = null) => {
    const section = project[sectionKey];
    const currentRow = rowId
      ? section.rows.find((row) => row.id === rowId)
      : createSectionRow(section.columns);

    setSectionEditor({
      open: true,
      sectionKey,
      rowId,
      draftValues: { ...(currentRow?.values ?? {}) },
    });
  };

  const submitSectionUpdate = async () => {
    const { sectionKey, rowId, draftValues } = sectionEditor;
    const section = project[sectionKey];

    const nextRows = rowId
      ? section.rows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                values: draftValues,
              }
            : row,
        )
      : [
          ...section.rows,
          {
            id: `row-${Date.now()}`,
            values: section.columns.reduce((acc, column) => {
              acc[column.id] = draftValues[column.id] ?? "";
              return acc;
            }, {}),
          },
        ];

    await updateSection(
      sectionKey,
      {
        ...section,
        rows: nextRows,
      },
      rowId ? "Cập nhật dữ liệu thành công" : "Đã thêm dòng dữ liệu",
    );

    setSectionEditor({
      open: false,
      sectionKey: "",
      rowId: null,
      draftValues: {},
    });
  };

  const removeSectionRow = async (sectionKey, rowId) => {
    const section = project[sectionKey];
    const nextRows = section.rows.filter((row) => row.id !== rowId);

    await updateSection(
      sectionKey,
      {
        ...section,
        rows: nextRows,
      },
      "Đã xóa dòng dữ liệu",
    );
  };

  const openSectionConfigEditor = (sectionKey) => {
    const section = project[sectionKey];
    setSectionConfigEditor({
      open: true,
      sectionKey,
      title: section.title,
      subtitle: section.subtitle,
      columns: section.columns.map((column) => ({ ...column })),
    });
  };

  const addConfigColumn = () => {
    setSectionConfigEditor((current) => ({
      ...current,
      columns: [...current.columns, createSectionColumn(`Tham số ${current.columns.length + 1}`)],
    }));
  };

  const updateConfigColumnName = (columnId, name) => {
    setSectionConfigEditor((current) => ({
      ...current,
      columns: current.columns.map((column) =>
        column.id === columnId
          ? {
              ...column,
              name,
            }
          : column,
      ),
    }));
  };

  const removeConfigColumn = (columnId) => {
    setSectionConfigEditor((current) => ({
      ...current,
      columns: current.columns.filter((column) => column.id !== columnId),
    }));
  };

  const submitSectionConfigUpdate = async () => {
    const { sectionKey, title, subtitle, columns } = sectionConfigEditor;

    if (!title.trim()) {
      message.warning("Vui lòng nhập tên bảng");
      return;
    }

    if (!columns.length) {
      message.warning("Vui lòng tạo ít nhất một tham số");
      return;
    }

    if (columns.some((column) => !column.name.trim())) {
      message.warning("Vui lòng nhập tên cho tất cả tham số");
      return;
    }

    const section = project[sectionKey];
    const nextSection = {
      ...section,
      title: title.trim(),
      subtitle: subtitle.trim(),
      columns: columns.map((column) => ({
        ...column,
        name: column.name.trim(),
      })),
      rows: section.rows.map((row) => ({
        ...row,
        values: columns.reduce((acc, column) => {
          acc[column.id] = row.values?.[column.id] ?? "";
          return acc;
        }, {}),
      })),
    };

    await updateSection(sectionKey, nextSection, "Cập nhật cấu hình bảng thành công");
    setSectionConfigEditor({
      open: false,
      sectionKey: "",
      title: "",
      subtitle: "",
      columns: [],
    });
  };

  const deleteSectionTable = async (sectionKey) => {
    await updateSection(
      sectionKey,
      {
        title: "",
        subtitle: "",
        columns: [],
        rows: [],
      },
      "Đã xóa bảng dữ liệu",
    );

    if (sectionConfigEditor.sectionKey === sectionKey) {
      setSectionConfigEditor({
        open: false,
        sectionKey: "",
        title: "",
        subtitle: "",
        columns: [],
      });
    }
  };

  const openAssignmentEditor = (employeeId, mode) => {
    const employee =
      employees.find((item) => item._id === employeeId) ||
      memberEmployees.find((item) => item._id === employeeId);
    const currentAssignment =
      project.members.find((member) => member.employeeId === employeeId)?.assignment ?? "";

    setAssignmentEditor({
      open: true,
      employeeId,
      employeeName: employee?.name ?? "Nhân viên",
      assignment: currentAssignment,
      mode,
    });
  };

  const submitAssignmentUpdate = async () => {
    const { employeeId, assignment, mode } = assignmentEditor;
    const nextMembers =
      mode === "add"
        ? [...members, { employeeId, assignment }]
        : members.map((member) =>
            member.employeeId === employeeId
              ? {
                  ...member,
                  assignment,
                }
              : member,
          );

    await saveProject(
      {
        ...project,
        members: nextMembers,
      },
      mode === "add" ? "Đã thêm thành viên" : "Đã cập nhật phân công",
    );

    setAssignmentEditor({
      open: false,
      employeeId: "",
      employeeName: "",
      assignment: "",
      mode: "add",
    });

    if (mode === "add") {
      setMemberToolboxOpen(false);
      setSearch("");
    }
  };

  const removeMember = async (employeeId) => {
    await saveProject(
      {
        ...project,
        members: members.filter((member) => member.employeeId !== employeeId),
      },
      "Đã xóa thành viên",
    );
  };

  const submitChatMessage = async () => {
    if (!chatInput.trim()) return;

    const nextMessage = {
      id: String(Date.now()),
      author: currentChatAuthor,
      text: chatInput.trim(),
      createdAt: new Date().toISOString(),
    };

    setChatInput("");
    await saveProject(
      {
        ...project,
        chatMessages: [...chatMessages, nextMessage],
      },
      "Đã lưu tin nhắn",
    );
  };

  const employeeColumns = [
    {
      title: "Ảnh",
      render: (_, record) => <Avatar src={record.avatar}>{record.name?.charAt(0)}</Avatar>,
      width: 80,
    },
    {
      title: "Tên",
      dataIndex: "name",
      width: 180,
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      width: 140,
    },
    {
      title: "Thao tác",
      render: (_, record) => (
        <Button type="primary" onClick={() => openAssignmentEditor(record._id, "add")}>
          Thêm vào dự án
        </Button>
      ),
      width: 180,
    },
  ];

  const memberColumns = [
    {
      title: "Ảnh",
      render: (_, record) => <Avatar src={record.avatar}>{record.name?.charAt(0)}</Avatar>,
      width: 80,
    },
    {
      title: "Tên",
      dataIndex: "name",
      width: 180,
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      width: 140,
    },
    {
      title: "Phân công",
      dataIndex: "assignment",
      render: (value) => value || EMPTY_VALUE,
    },
    {
      title: "Thao tác",
      render: (_, record) =>
        isAdmin ? (
          <Space>
            <Button onClick={() => openAssignmentEditor(record._id, "edit")}>Cập nhật</Button>
            <Button danger onClick={() => removeMember(record._id)} loading={saving}>
              Xóa
            </Button>
          </Space>
        ) : null,
      width: 200,
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div>
        <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
          <div>
            <Title level={2} style={{ marginBottom: 4 }}>
              {project.name || "Chi tiết dự án"}
            </Title>
            <Text type="secondary">Thông tin và nhật ký công việc của dự án.</Text>
          </div>

          <Space>
            {isAdmin && <Button onClick={openOverviewEditor}>Cập nhật thông tin</Button>}
            <Button icon={<DownloadOutlined />} onClick={() => exportProjectToExcel(project, memberEmployees)}>
              Xuất Excel
            </Button>
          </Space>
        </Space>
      </div>

      <Row gutter={[24, 24]} align="stretch">
        <Col xs={24} xl={10}>
          <Card title="Tổng quan dự án" style={{ height: "100%" }}>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Tên dự án">{project.name || EMPTY_VALUE}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={project.status === "active" ? "green" : "default"}>
                  {project.status === "active" ? "Đang hoạt động" : "Ngưng hoạt động"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Công trình">{project.siteName || EMPTY_VALUE}</Descriptions.Item>
              <Descriptions.Item label="Mã số">{project.code || EMPTY_VALUE}</Descriptions.Item>
              <Descriptions.Item label="Ngày">{project.date || EMPTY_VALUE}</Descriptions.Item>
              <Descriptions.Item label="Biểu mẫu">{project.formNo || EMPTY_VALUE}</Descriptions.Item>
              <Descriptions.Item label="Hiệu chỉnh">{project.revision || EMPTY_VALUE}</Descriptions.Item>
              <Descriptions.Item label="Mô tả">{project.desc || EMPTY_VALUE}</Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">Số phiên bản lịch sử đã lưu: {project.updateHistory?.length ?? 0}</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={14}>
          <Card title="Phân công nhân sự" style={{ height: "100%" }}>
            <Card
              size="small"
              title="Thành viên dự án"
              extra={isAdmin ? <Button onClick={() => setMemberToolboxOpen(true)}>Thêm thành viên</Button> : null}
              style={{ height: "100%" }}
              bodyStyle={{ height: "calc(100% - 57px)" }}
            >
              <Table
                rowKey="_id"
                columns={memberColumns}
                dataSource={memberEmployees}
                pagination={false}
                scroll={{ x: 700, y: 320 }}
              />
            </Card>
          </Card>
        </Col>
      </Row>

      {isAdmin && (
        <Card title="Tạo bảng mới">
          {availableSectionTemplates.length ? (
            <Space wrap size="middle">
              {availableSectionTemplates.map((sectionMeta) => (
                <Card
                  key={sectionMeta.key}
                  size="small"
                  style={{ width: 280, borderRadius: 14 }}
                  bodyStyle={{ padding: 16 }}
                >
                  <Space direction="vertical" size={10} style={{ width: "100%" }}>
                    <div>
                      <Text strong>{sectionMeta.title}</Text>
                      <div>
                        <Text type="secondary">{sectionMeta.subtitle}</Text>
                      </div>
                    </div>
                    <Button type="primary" onClick={() => openSectionConfigEditor(sectionMeta.key)}>
                      Tạo bảng
                    </Button>
                  </Space>
                </Card>
              ))}
            </Space>
          ) : (
            <Empty description="Tất cả bảng đã được tạo" />
          )}
        </Card>
      )}

      {createdSections.map((sectionMeta) => {
        const section = project[sectionMeta.key];
        const columns = [
          {
            title: "STT",
            render: (_, __, index) => index + 1,
            width: 70,
            fixed: "left",
          },
          ...(section.columns ?? []).map((column) => ({
            title: column.name || "Tham số",
            dataIndex: ["values", column.id],
            width: 220,
            render: (value) => value || EMPTY_VALUE,
          })),
          {
            title: "Thao tác",
            render: (_, record) => (
              <Space>
                <Button onClick={() => openSectionEditor(sectionMeta.key, record.id)}>Cập nhật</Button>
                <Button danger onClick={() => removeSectionRow(sectionMeta.key, record.id)} loading={saving}>
                  Xóa
                </Button>
              </Space>
            ),
            width: 180,
            fixed: "right",
          },
        ];

        return (
          <Card
            key={sectionMeta.key}
            title={section.title}
            extra={
              <Space wrap>
                {!!section.subtitle && <Text type="secondary">{section.subtitle}</Text>}
                {isAdmin && <Button onClick={() => openSectionConfigEditor(sectionMeta.key)}>Cấu hình bảng</Button>}
                {isAdmin && (
                  <Button danger onClick={() => deleteSectionTable(sectionMeta.key)} loading={saving}>
                    Xóa bảng
                  </Button>
                )}
                <Button
                  onClick={() => {
                    if (!section.columns.length) {
                      message.warning("Hãy tạo ít nhất một tham số trước khi thêm dữ liệu");
                      return;
                    }
                    openSectionEditor(sectionMeta.key);
                  }}
                >
                  Thêm dòng
                </Button>
              </Space>
            }
          >
            <Table
              rowKey="id"
              columns={columns}
              dataSource={section.rows}
              pagination={false}
              locale={{ emptyText: <Empty description="Chưa có dữ liệu" /> }}
              scroll={{ x: 1100 }}
            />
          </Card>
        );
      })}

      <Card title="Nhật ký thao tác">
        {activityLogs.length ? (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {activityLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background: "#f8fafc",
                }}
              >
                <Avatar src={findEmployeeByActorName(log.actorName)?.avatar}>
                  {(log.actorName || "A").charAt(0)}
                </Avatar>
                <Space direction="vertical" size={2}>
                  <Text>
                    {log.actorName || "Nhân viên"} đã chỉnh sửa {log.sectionLabel || "bảng dữ liệu"}
                  </Text>
                  <Text type="secondary">{formatDateTime(log.createdAt)}</Text>
                </Space>
              </div>
            ))}
          </Space>
        ) : (
          <Empty description="Chưa có nhật ký thao tác" />
        )}
      </Card>

      {isAdmin && (
        <Modal
          open={memberToolboxOpen}
          title="Thêm thành viên"
          onCancel={() => setMemberToolboxOpen(false)}
          footer={null}
          width={900}
        >
          <Input
            placeholder="Tìm kiếm nhân viên..."
            style={{ width: 320, marginBottom: 16 }}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <Table
            rowKey="_id"
            columns={employeeColumns}
            dataSource={availableEmployees}
            pagination={{ pageSize: 6, hideOnSinglePage: true }}
            scroll={{ x: 700 }}
          />
        </Modal>
      )}

      {isAdmin && (
        <Modal
          open={overviewOpen}
          title="Cập nhật thông tin dự án"
          onCancel={() => setOverviewOpen(false)}
          onOk={submitOverviewUpdate}
          okText="Cập nhật thông tin"
          confirmLoading={saving}
        >
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <div>
              <Text>Tên dự án</Text>
              <Input
                value={overviewDraft.name}
                onChange={(event) =>
                  setOverviewDraft((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>

            <div>
              <Text>Trạng thái</Text>
              <Select
                style={{ width: "100%" }}
                value={overviewDraft.status}
                onChange={(value) =>
                  setOverviewDraft((current) => ({ ...current, status: value }))
                }
                options={[
                  { value: "active", label: "Đang hoạt động" },
                  { value: "inactive", label: "Ngưng hoạt động" },
                ]}
              />
            </div>

            <div>
              <Text>Công trình</Text>
              <Input
                value={overviewDraft.siteName}
                onChange={(event) =>
                  setOverviewDraft((current) => ({ ...current, siteName: event.target.value }))
                }
              />
            </div>

            <Row gutter={12}>
              <Col span={12}>
                <Text>Mã số</Text>
                <Input
                  value={overviewDraft.code}
                  onChange={(event) =>
                    setOverviewDraft((current) => ({ ...current, code: event.target.value }))
                  }
                />
              </Col>

              <Col span={12}>
                <Text>Ngày</Text>
                <Input
                  value={overviewDraft.date}
                  onChange={(event) =>
                    setOverviewDraft((current) => ({ ...current, date: event.target.value }))
                  }
                />
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={12}>
                <Text>Biểu mẫu</Text>
                <Input
                  value={overviewDraft.formNo}
                  onChange={(event) =>
                    setOverviewDraft((current) => ({ ...current, formNo: event.target.value }))
                  }
                />
              </Col>

              <Col span={12}>
                <Text>Hiệu chỉnh</Text>
                <Input
                  value={overviewDraft.revision}
                  onChange={(event) =>
                    setOverviewDraft((current) => ({ ...current, revision: event.target.value }))
                  }
                />
              </Col>
            </Row>

            <div>
              <Text>Mô tả</Text>
              <Input.TextArea
                rows={4}
                value={overviewDraft.desc}
                onChange={(event) =>
                  setOverviewDraft((current) => ({ ...current, desc: event.target.value }))
                }
              />
            </div>
          </Space>
        </Modal>
      )}

      <Modal
        open={sectionEditor.open}
        title={sectionEditor.rowId ? "Cập nhật dữ liệu" : "Thêm dòng dữ liệu"}
        onCancel={() =>
          setSectionEditor({
            open: false,
            sectionKey: "",
            rowId: null,
            draftValues: {},
          })
        }
        onOk={submitSectionUpdate}
        okText="Lưu dữ liệu"
        confirmLoading={saving}
        width={820}
      >
        <Row gutter={[12, 12]}>
          {(project[sectionEditor.sectionKey]?.columns ?? []).map((column) => (
            <Col span={12} key={column.id}>
              <Text>{column.name}</Text>
              <Input.TextArea
                rows={3}
                value={sectionEditor.draftValues[column.id] ?? ""}
                onChange={(event) =>
                  setSectionEditor((current) => ({
                    ...current,
                    draftValues: {
                      ...current.draftValues,
                      [column.id]: event.target.value,
                    },
                  }))
                }
              />
            </Col>
          ))}
        </Row>
      </Modal>

      {isAdmin && (
        <Modal
          open={sectionConfigEditor.open}
          title="Cấu hình bảng dữ liệu"
          onCancel={() =>
            setSectionConfigEditor({
              open: false,
              sectionKey: "",
              title: "",
              subtitle: "",
              columns: [],
            })
          }
          onOk={submitSectionConfigUpdate}
          okText="Lưu cấu hình"
          confirmLoading={saving}
          width={860}
        >
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <div>
              <Text>Tên bảng</Text>
              <Input
                value={sectionConfigEditor.title}
                onChange={(event) =>
                  setSectionConfigEditor((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Text>Mô tả ngắn</Text>
              <Input
                value={sectionConfigEditor.subtitle}
                onChange={(event) =>
                  setSectionConfigEditor((current) => ({
                    ...current,
                    subtitle: event.target.value,
                  }))
                }
              />
            </div>

            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Text strong>Danh sách tham số</Text>
              <Button onClick={addConfigColumn}>Thêm tham số</Button>
            </Space>

            <Space direction="vertical" style={{ width: "100%" }}>
              {sectionConfigEditor.columns.map((column, index) => (
                <Space key={column.id} align="start" style={{ width: "100%" }}>
                  <Input
                    value={column.name}
                    placeholder={`Tên tham số ${index + 1}`}
                    onChange={(event) => updateConfigColumnName(column.id, event.target.value)}
                  />
                  <Button danger onClick={() => removeConfigColumn(column.id)}>
                    Xóa
                  </Button>
                </Space>
              ))}
            </Space>
          </Space>
        </Modal>
      )}

      {isAdmin && (
        <Modal
          open={assignmentEditor.open}
          title={assignmentEditor.mode === "add" ? "Thêm thành viên" : "Cập nhật phân công"}
          onCancel={() =>
            setAssignmentEditor({
              open: false,
              employeeId: "",
              employeeName: "",
              assignment: "",
              mode: "add",
            })
          }
          onOk={submitAssignmentUpdate}
          okText="Cập nhật thông tin"
          confirmLoading={saving}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <Text>Nhân viên</Text>
              <Input value={assignmentEditor.employeeName} disabled />
            </div>
            <div>
              <Text>Phân công</Text>
              <Input.TextArea
                rows={4}
                value={assignmentEditor.assignment}
                onChange={(event) =>
                  setAssignmentEditor((current) => ({
                    ...current,
                    assignment: event.target.value,
                  }))
                }
              />
            </div>
          </Space>
        </Modal>
      )}

      {chatOpen && (
        <Card
          title="Hộp chat"
          extra={<Button type="text" icon={<CloseOutlined />} onClick={() => setChatOpen(false)} />}
          style={{
            position: "fixed",
            right: 24,
            bottom: 96,
            width: 360,
            zIndex: 1000,
            boxShadow: "0 16px 40px rgba(15, 23, 42, 0.18)",
          }}
          bodyStyle={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            height: 420,
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              {chatMessages.map((chat) => (
                <div
                  key={chat.id}
                  style={{
                    alignSelf: chat.author === currentChatAuthor ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {chat.author}
                  </Text>
                  <div
                    style={{
                      marginTop: 4,
                      padding: "10px 12px",
                      borderRadius: 14,
                      background: chat.author === currentChatAuthor ? "#dcfce7" : "#f3f4f6",
                    }}
                  >
                    <Text>{chat.text}</Text>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {formatDateTime(chat.createdAt)}
                    </Text>
                  </div>
                </div>
              ))}
            </Space>
          </div>

          <Space.Compact style={{ width: "100%" }}>
            <Input
              placeholder="Nhập tin nhắn..."
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onPressEnter={submitChatMessage}
            />
            <Button type="primary" icon={<SendOutlined />} onClick={submitChatMessage} />
          </Space.Compact>
        </Card>
      )}

      <Button
        type="primary"
        shape="circle"
        size="large"
        icon={<CommentOutlined />}
        onClick={() => setChatOpen((current) => !current)}
        style={{
          position: "fixed",
          right: 24,
          bottom: 24,
          width: 56,
          height: 56,
          zIndex: 1001,
          boxShadow: "0 16px 30px rgba(37, 99, 235, 0.35)",
        }}
      />
    </Space>
  );
}
