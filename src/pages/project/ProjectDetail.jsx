import { useEffect, useState } from "react";
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
import { exportProjectToExcel } from "../../utils/projectExport";
import {
  createSectionRow,
  createProjectTemplate,
  normalizeProject,
  SECTION_CONFIG,
} from "../../utils/projectTemplate";

const { Title, Text } = Typography;
const EMPTY_VALUE = "-";
const formatChatTime = (value) => {
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
const SECTION_FIELD_CONFIG = [
  { label: "Hạng Mục", dataIndex: "objective" },
  { label: "Biểu Mẫu Sử Dụng", dataIndex: "usedForms" },
  { label: "Người Thực Hiện", dataIndex: "personInCharge" },
  { label: "Thời Gian Bắt Đầu", dataIndex: "startTime" },
  { label: "Thời Gian Hoàn Thành", dataIndex: "endTime" },
  { label: "Kết Quả Thực Hiện", dataIndex: "accomplishment" },
  { label: "Biện Pháp Khắc Phục", dataIndex: "correctiveMeasure" },
  { label: "Ghi Chú", dataIndex: "remarks" },
];

export default function ProjectDetail() {
  const { id } = useParams();

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
    index: null,
    draft: createSectionRow(),
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
      const projects = await getProjects();
      const foundProject = projects.find((item) => item._id === id);
      const emps = await getEmployees();

      setProject(normalizeProject(foundProject));
      setEmployees(emps);
    };

    fetchData();
  }, [id]);

  if (!project) return <h2>Đang tải...</h2>;

  const members = project.members ?? [];
  const memberEmployees = members
    .map((member) => {
      const employee = employees.find((item) => item._id === member.employeeId);
      if (!employee) return null;

      return {
        ...employee,
        assignment: member.assignment,
      };
    })
    .filter(Boolean);

  const availableEmployees = employees
    .filter((employee) => !members.some((member) => member.employeeId === employee._id))
    .filter((employee) => employee.name?.toLowerCase().includes(search.toLowerCase()));

  const chatMessages = project?.chatMessages?.length
    ? project.chatMessages
    : [
        {
          id: "system-welcome",
          author: "Hệ thống",
          text: "Xin chào, đây là hộp chat nhanh cho người dùng trong trang chi tiết dự án.",
          createdAt: new Date().toISOString(),
        },
      ];

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

  const openSectionEditor = (sectionKey, index = null) => {
    const currentRow =
      index === null ? createSectionRow() : (project[sectionKey]?.[index] ?? createSectionRow());

    setSectionEditor({
      open: true,
      sectionKey,
      index,
      draft: { ...currentRow },
    });
  };

  const submitSectionUpdate = async () => {
    const { sectionKey, index, draft } = sectionEditor;
    const nextRows =
      index === null
        ? [...project[sectionKey], draft]
        : project[sectionKey].map((row, rowIndex) => (rowIndex === index ? draft : row));

    await saveProject(
      {
        ...project,
        [sectionKey]: nextRows,
      },
      index === null ? "Đã thêm dòng" : "Cập nhật thông tin thành công",
    );

    setSectionEditor({
      open: false,
      sectionKey: "",
      index: null,
      draft: createSectionRow(),
    });
  };

  const removeSectionRow = async (sectionKey, index) => {
    const nextRows = project[sectionKey].filter((_, rowIndex) => rowIndex !== index);

    await saveProject(
      {
        ...project,
        [sectionKey]: nextRows.length ? nextRows : [createSectionRow()],
      },
      "Đã xóa dòng",
    );
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
      author: "Người dùng",
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
      title: "Vai Trò",
      dataIndex: "role",
      width: 140,
    },
    {
      title: "Thao Tác",
      render: (_, record) => (
        <Button type="primary" onClick={() => openAssignmentEditor(record._id, "add")}>
          Thêm Vào Dự Án
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
      title: "Vai Trò",
      dataIndex: "role",
      width: 140,
    },
    {
      title: "Phân Công",
      dataIndex: "assignment",
      render: (value) => value || EMPTY_VALUE,
    },
    {
      title: "Thao Tác",
      render: (_, record) => (
        <Space>
          <Button onClick={() => openAssignmentEditor(record._id, "edit")}>Cập Nhật</Button>
          <Button danger onClick={() => removeMember(record._id)} loading={saving}>
            Xóa
          </Button>
        </Space>
      ),
      width: 200,
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div>
        <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
          <div>
            <Title level={2} style={{ marginBottom: 4 }}>
              {project.name || "Chi Tiết Dự Án"}
            </Title>
            <Text type="secondary">
              Cấu trúc được xây dựng theo mẫu quản lý tiến độ thi công.
            </Text>
          </div>

          <Space>
            <Button onClick={openOverviewEditor}>Cập Nhật Thông Tin</Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => exportProjectToExcel(project, memberEmployees)}
            >
              Xuất Excel
            </Button>
          </Space>
        </Space>
      </div>

      <Row gutter={[24, 24]} align="stretch">
        <Col xs={24} xl={10}>
          <Card title="Tổng Quan Dự Án" style={{ height: "100%" }}>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Tên Dự Án">{project.name || EMPTY_VALUE}</Descriptions.Item>
              <Descriptions.Item label="Trạng Thái">
                <Tag color={project.status === "active" ? "green" : "default"}>
                  {project.status === "active" ? "Đang Hoạt Động" : "Ngưng Hoạt Động"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Công Trình">
                {project.siteName || EMPTY_VALUE}
              </Descriptions.Item>
              <Descriptions.Item label="Mã Số">{project.code || EMPTY_VALUE}</Descriptions.Item>
              <Descriptions.Item label="Ngày">{project.date || EMPTY_VALUE}</Descriptions.Item>
              <Descriptions.Item label="Biểu Mẫu">{project.formNo || EMPTY_VALUE}</Descriptions.Item>
              <Descriptions.Item label="Hiệu Chỉnh">
                {project.revision || EMPTY_VALUE}
              </Descriptions.Item>
              <Descriptions.Item label="Mô Tả">{project.desc || EMPTY_VALUE}</Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">
                Số phiên bản lịch sử đã lưu: {project.updateHistory?.length ?? 0}
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={14}>
          <Card title="Phân Công Nhân Sự" style={{ height: "100%" }}>
            <Card
              size="small"
              title="Thành Viên Dự Án"
              extra={<Button onClick={() => setMemberToolboxOpen(true)}>Thêm Thành Viên</Button>}
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

      {SECTION_CONFIG.map((section) => {
        const columns = [
          {
            title: "STT",
            render: (_, __, index) => index + 1,
            width: 70,
            fixed: "left",
          },
          ...SECTION_FIELD_CONFIG.map((column) => ({
            title: column.label,
            dataIndex: column.dataIndex,
            width:
              column.dataIndex === "objective" ||
              column.dataIndex === "accomplishment" ||
              column.dataIndex === "correctiveMeasure"
                ? 220
                : 170,
            render: (value) => value || EMPTY_VALUE,
          })),
          {
            title: "Thao Tác",
            render: (_, __, index) => (
              <Space>
                <Button onClick={() => openSectionEditor(section.key, index)}>Cập Nhật</Button>
                <Button danger onClick={() => removeSectionRow(section.key, index)} loading={saving}>
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
            key={section.key}
            title={section.title}
            extra={
              <Space>
                <Text type="secondary">{section.subtitle}</Text>
                <Button onClick={() => openSectionEditor(section.key)}>Thêm Dòng</Button>
              </Space>
            }
          >
            <Table
              rowKey={(_, index) => `${section.key}-${index}`}
              columns={columns}
              dataSource={project[section.key]}
              pagination={false}
              locale={{ emptyText: <Empty description="Chưa có dữ liệu" /> }}
              scroll={{ x: 1600 }}
            />
          </Card>
        );
      })}

      <Modal
        open={memberToolboxOpen}
        title="Thêm Thành Viên"
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

      <Modal
        open={overviewOpen}
        title="Cập Nhật Thông Tin Dự Án"
        onCancel={() => setOverviewOpen(false)}
        onOk={submitOverviewUpdate}
        okText="Cập Nhật Thông Tin"
        confirmLoading={saving}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <Text>Tên Dự Án</Text>
            <Input
              value={overviewDraft.name}
              onChange={(event) =>
                setOverviewDraft((current) => ({ ...current, name: event.target.value }))
              }
            />
          </div>

          <div>
            <Text>Trạng Thái</Text>
            <Select
              style={{ width: "100%" }}
              value={overviewDraft.status}
              onChange={(value) =>
                setOverviewDraft((current) => ({ ...current, status: value }))
              }
              options={[
                { value: "active", label: "Đang Hoạt Động" },
                { value: "inactive", label: "Ngưng Hoạt Động" },
              ]}
            />
          </div>

          <div>
            <Text>Công Trình</Text>
            <Input
              value={overviewDraft.siteName}
              onChange={(event) =>
                setOverviewDraft((current) => ({ ...current, siteName: event.target.value }))
              }
            />
          </div>

          <Row gutter={12}>
            <Col span={12}>
              <Text>Mã Số</Text>
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
              <Text>Biểu Mẫu</Text>
              <Input
                value={overviewDraft.formNo}
                onChange={(event) =>
                  setOverviewDraft((current) => ({ ...current, formNo: event.target.value }))
                }
              />
            </Col>

            <Col span={12}>
              <Text>Hiệu Chỉnh</Text>
              <Input
                value={overviewDraft.revision}
                onChange={(event) =>
                  setOverviewDraft((current) => ({ ...current, revision: event.target.value }))
                }
              />
            </Col>
          </Row>

          <div>
            <Text>Mô Tả</Text>
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

      <Modal
        open={sectionEditor.open}
        title={sectionEditor.index === null ? "Thêm Dòng" : "Cập Nhật Thông Tin"}
        onCancel={() =>
          setSectionEditor({
            open: false,
            sectionKey: "",
            index: null,
            draft: createSectionRow(),
          })
        }
        onOk={submitSectionUpdate}
        okText="Cập Nhật Thông Tin"
        confirmLoading={saving}
        width={760}
      >
        <Row gutter={[12, 12]}>
          {SECTION_FIELD_CONFIG.map((field) => (
            <Col span={12} key={field.dataIndex}>
              <Text>{field.label}</Text>
              <Input.TextArea
                rows={field.dataIndex === "objective" ? 3 : 2}
                value={sectionEditor.draft[field.dataIndex]}
                onChange={(event) =>
                  setSectionEditor((current) => ({
                    ...current,
                    draft: {
                      ...current.draft,
                      [field.dataIndex]: event.target.value,
                    },
                  }))
                }
              />
            </Col>
          ))}
        </Row>
      </Modal>

      <Modal
        open={assignmentEditor.open}
        title={assignmentEditor.mode === "add" ? "Thêm Thành Viên" : "Cập Nhật Phân Công"}
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
        okText="Cập Nhật Thông Tin"
        confirmLoading={saving}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <Text>Nhân Viên</Text>
            <Input value={assignmentEditor.employeeName} disabled />
          </div>
          <div>
            <Text>Phân Công</Text>
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

      {chatOpen && (
        <Card
          title="Hộp Chat"
          extra={
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setChatOpen(false)}
            />
          }
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
                    alignSelf: chat.author === "Người dùng" ? "flex-end" : "flex-start",
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
                      background: chat.author === "Người dùng" ? "#dcfce7" : "#f3f4f6",
                    }}
                  >
                    <Text>{chat.text}</Text>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {formatChatTime(chat.createdAt)}
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
