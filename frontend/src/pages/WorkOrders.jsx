import { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Input, Select, DatePicker, InputNumber, message, 
  Space, Tag, Steps, Card, Descriptions, Divider, List, Row, Col, Grid
} from 'antd';
import { PlusOutlined, EyeOutlined, ArrowRightOutlined, ReloadOutlined } from '@ant-design/icons';
import { 
  getWorkOrders, getWorkOrder, createWorkOrder, advanceStage, reworkOrder,
  getRoughStones, getCustomers, getSandpaper, getPolishingPaste } from '../api';

const { Option } = Select;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

const stageNames = {
  cutting: '切形',
  grinding: '打磨',
  polishing: '抛光',
  drilling: '穿孔',
  recheck: '复检',
  completed: '已完成'
};

const statusColors = {
  processing: 'blue',
  completed: 'green',
  overdue: 'red',
  rework: 'orange'
};

const statusTexts = {
  processing: '处理中',
  completed: '已完成',
  overdue: '已超期',
  rework: '返工中'
};

const stageOrder = ['cutting', 'grinding', 'polishing', 'drilling', 'recheck', 'completed'];

const WorkOrders = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [orders, setOrders] = useState([]);
  const [stones, setStones] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sandpaper, setSandpaper] = useState([]);
  const [polishingPaste, setPolishingPaste] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [advanceModalVisible, setAdvanceModalVisible] = useState(false);
  const [reworkModalVisible, setReworkModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [createForm] = Form.useForm();
  const [advanceForm] = Form.useForm();
  const [reworkForm] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, stonesRes, customersRes, sandpaperRes, pasteRes] = await Promise.all([
        getWorkOrders(),
        getRoughStones(),
        getCustomers(),
        getSandpaper(),
        getPolishingPaste()
      ]);
      setOrders(ordersRes.data);
      setStones(stonesRes.data);
      setCustomers(customersRes.data);
      setSandpaper(sandpaperRes.data);
      setPolishingPaste(pasteRes.data);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (values) => {
    try {
      await createWorkOrder({
        ...values,
        delivery_date: values.delivery_date.format('YYYY-MM-DD')
      });
      message.success('工单创建成功');
      setCreateModalVisible(false);
      createForm.resetFields();
      fetchData();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleViewDetail = async (order) => {
    setSelectedOrder(order);
    try {
      const response = await getWorkOrder(order.id);
      setOrderDetail(response.data);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('获取详情失败');
    }
  };

  const handleAdvanceStage = (order) => {
    setSelectedOrder(order);
    advanceForm.resetFields();
    advanceForm.setFieldsValue({
      stage: order.current_stage,
      weight_before: order.initial_weight
    });
    setAdvanceModalVisible(true);
  };

  const handleSubmitAdvance = async (values) => {
    // 前端校验：修整后重量不大于修整前重量
    if (values.weight_after != null && values.weight_before != null
        && Number(values.weight_after) > Number(values.weight_before)) {
      message.error('修整后重量不能大于修整前重量');
      return;
    }
    // 砂纸用量与砂纸必须配对
    if (values.sandpaper_used && values.sandpaper_used > 0 && !values.sandpaper_id) {
      message.error('填写砂纸用量时必须选择砂纸');
      return;
    }
    if (values.sandpaper_id && (!values.sandpaper_used || values.sandpaper_used <= 0)) {
      message.error('选择砂纸后必须填写砂纸用量');
      return;
    }
    // 抛光膏用量与抛光膏必须配对
    if (values.polishing_paste_used && values.polishing_paste_used > 0 && !values.polishing_paste_id) {
      message.error('填写抛光膏用量时必须选择抛光膏');
      return;
    }
    if (values.polishing_paste_id && (!values.polishing_paste_used || values.polishing_paste_used <= 0)) {
      message.error('选择抛光膏后必须填写用量');
      return;
    }
    // 抛光膏库存校验
    if (values.polishing_paste_id && values.polishing_paste_used) {
      const paste = polishingPaste.find(p => p.id === values.polishing_paste_id);
      if (paste && Number(values.polishing_paste_used) > Number(paste.stock_quantity)) {
        message.error(`抛光膏用量不能超过当前库存（${paste.stock_quantity}g）`);
        return;
      }
    }

    try {
      await advanceStage(selectedOrder.id, values);
      message.success('阶段推进成功');
      setAdvanceModalVisible(false);
      advanceForm.resetFields();
      fetchData();
      if (orderDetail && orderDetail.id === selectedOrder.id) {
        const response = await getWorkOrder(selectedOrder.id);
        setOrderDetail(response.data);
      }
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleRework = (order) => {
    setSelectedOrder(order);
    reworkForm.resetFields();
    setReworkModalVisible(true);
  };

  const handleSubmitRework = async (values) => {
    try {
      await reworkOrder(selectedOrder.id, values);
      message.success('返工设置成功');
      setReworkModalVisible(false);
      reworkForm.resetFields();
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getCurrentStepIndex = (stage) => {
    const idx = stageOrder.indexOf(stage);
    return idx === -1 ? 0 : idx;
  };

  // 是否处于复检阶段（用于店员申请返工入口）
  const canRework = (record) => {
    return record.current_stage === 'recheck' && record.status !== 'completed';
  };

  const columns = [
    { title: '工单编号', dataIndex: 'order_no', key: 'order_no', width: 140 },
    { title: '原石名称', dataIndex: 'stone_name', key: 'stone_name', width: 140 },
    { title: '客户', dataIndex: 'customer_name', key: 'customer_name', width: 120 },
    {
      title: '当前阶段',
      dataIndex: 'current_stage',
      key: 'current_stage',
      width: 100,
      render: (stage) => <Tag color="blue">{stageNames[stage]}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <Tag color={statusColors[status]}>{statusTexts[status]}</Tag>
    },
    { title: '交付日期', dataIndex: 'delivery_date', key: 'delivery_date', width: 120 },
    {
      title: '返工次数',
      dataIndex: 'rework_count',
      key: 'rework_count',
      width: 100,
      render: (count) => count > 0 ? <Tag color="orange">{count} 次</Tag> : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: isMobile ? undefined : 'right',
      render: (_, record) => (
        <Space wrap>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {user.role === 'craftsman' && record.status !== 'completed' && record.current_stage !== 'completed' && (
            <Button type="link" icon={<ArrowRightOutlined />} onClick={() => handleAdvanceStage(record)}>
              推进阶段
            </Button>
          )}
          {user.role === 'clerk' && canRework(record) && (
            <Button type="link" icon={<ReloadOutlined />} onClick={() => handleRework(record)}>
              申请返工
            </Button>
          )}
        </Space>
      )
    }
  ];

  // 推进阶段表单中，砂纸/抛光膏用量受所选项控制，库存校验
  const validateWeightAfter = ({ getFieldValue }) => ({
    validator(_, value) {
      const before = getFieldValue('weight_before');
      if (value == null || before == null) return Promise.resolve();
      if (Number(value) > Number(before)) {
        return Promise.reject(new Error('修整后重量不能大于修整前重量'));
      }
      return Promise.resolve();
    }
  });

  const validatePasteUsed = ({ getFieldValue }) => ({
    validator(_, value) {
      const id = getFieldValue('polishing_paste_id');
      if (id && (!value || value <= 0)) {
        return Promise.reject(new Error('请填写抛光膏用量'));
      }
      if (value && value > 0 && !id) {
        return Promise.reject(new Error('请选择抛光膏'));
      }
      if (id && value) {
        const paste = polishingPaste.find(p => p.id === id);
        if (paste && Number(value) > Number(paste.stock_quantity)) {
          return Promise.reject(new Error(`不能超过库存（${paste.stock_quantity}g）`));
        }
      }
      return Promise.resolve();
    }
  });

  const validateSandpaperUsed = ({ getFieldValue }) => ({
    validator(_, value) {
      const id = getFieldValue('sandpaper_id');
      if (id && (!value || value <= 0)) {
        return Promise.reject(new Error('请填写砂纸用量'));
      }
      if (value && value > 0 && !id) {
        return Promise.reject(new Error('请选择砂纸'));
      }
      return Promise.resolve();
    }
  });

  return (
    <div>
      <div style={{
        marginBottom: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8
      }}>
        <h2 style={{ margin: 0 }}>工单管理</h2>
        {user.role === 'clerk' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            创建工单
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1100 }}
      />

      <Modal
        title="创建工单"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={isMobile ? '95%' : 600}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateOrder}>
          <Form.Item name="stone_id" label="选择原石" rules={[{ required: true }]}>
            <Select placeholder="请选择原石">
              {stones.map(stone => (
                <Option key={stone.id} value={stone.id}>
                  {stone.stone_no} - {stone.name} ({stone.initial_weight}g)
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="customer_id" label="选择客户">
            <Select placeholder="请选择客户">
              {customers.map(customer => (
                <Option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.phone || '-'})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="delivery_date" label="交付日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">创建</Button>
              <Button onClick={() => setCreateModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="工单详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={isMobile ? '95%' : 900}
      >
        {orderDetail && (
          <div>
            <Steps
              current={getCurrentStepIndex(orderDetail.current_stage)}
              direction={isMobile ? 'vertical' : 'horizontal'}
              size="small"
              status={orderDetail.current_stage === 'completed' ? 'finish' : 'process'}
              style={{ marginBottom: 24 }}
              items={stageOrder.map(stage => ({
                key: stage,
                title: stageNames[stage]
              }))}
            />

            <Descriptions
              title="基本信息"
              bordered
              column={isMobile ? 1 : 2}
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="工单编号">{orderDetail.order_no}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColors[orderDetail.status]}>{statusTexts[orderDetail.status]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="原石名称">{orderDetail.stone_name}</Descriptions.Item>
              <Descriptions.Item label="初始重量">{orderDetail.initial_weight}g</Descriptions.Item>
              <Descriptions.Item label="客户">{orderDetail.customer_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="交付日期">{orderDetail.delivery_date}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">阶段记录</Divider>
            <List
              dataSource={orderDetail.records || []}
              renderItem={record => (
                <List.Item>
                  <Card size="small" style={{ width: '100%' }}>
                    <Row gutter={[16, 8]}>
                      <Col xs={24} sm={12} md={6}>
                        <div><strong>阶段：</strong>{stageNames[record.stage]}</div>
                        <div><strong>工匠：</strong>{record.craftsman_name || '-'}</div>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <div><strong>修整前重量：</strong>{record.weight_before}g</div>
                        <div><strong>修整后重量：</strong>{record.weight_after}g</div>
                        <div><strong>损耗：</strong>{record.weight_loss}g</div>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <div><strong>砂纸：</strong>{record.grit ? `${record.grit}目` : '-'}</div>
                        <div><strong>砂纸用量：</strong>{record.sandpaper_used || 0} 张</div>
                        <div><strong>抛光膏：</strong>{record.paste_name || '-'}</div>
                        <div><strong>抛光膏用量：</strong>{record.polishing_paste_used || 0}g</div>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <div><strong>裂纹风险：</strong>{record.crack_risk || '无'}</div>
                        <div><strong>备注：</strong>{record.notes || '-'}</div>
                        <div><strong>完成时间：</strong>{record.end_time ? new Date(record.end_time).toLocaleString() : '-'}</div>
                      </Col>
                    </Row>
                  </Card>
                </List.Item>
              )}
            />

            {orderDetail.rework_reason && (
              <>
                <Divider orientation="left">返工信息</Divider>
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="返工原因">{orderDetail.rework_reason}</Descriptions.Item>
                  <Descriptions.Item label="返工次数">{orderDetail.rework_count} 次</Descriptions.Item>
                </Descriptions>
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="推进工单阶段"
        open={advanceModalVisible}
        onCancel={() => setAdvanceModalVisible(false)}
        footer={null}
        width={isMobile ? '95%' : 600}
      >
        {selectedOrder && (
          <div>
            <p>当前阶段：<Tag color="blue">{stageNames[selectedOrder.current_stage]}</Tag></p>
            <Form form={advanceForm} layout="vertical" onFinish={handleSubmitAdvance}>
              <Form.Item name="stage" hidden>
                <Input />
              </Form.Item>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="weight_before"
                    label="修整前重量(g)"
                    rules={[{ required: true, message: '请输入修整前重量' }]}
                  >
                    <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="weight_after"
                    label="修整后重量(g)"
                    dependencies={['weight_before']}
                    rules={[
                      { required: true, message: '请输入修整后重量' },
                      validateWeightAfter
                    ]}
                  >
                    <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="sandpaper_id" label="使用砂纸">
                    <Select placeholder="请选择砂纸" allowClear>
                      {sandpaper.map(s => (
                        <Option key={s.id} value={s.id}>{s.grit}目</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="sandpaper_used"
                    label="砂纸用量(张)"
                    dependencies={['sandpaper_id']}
                    rules={[validateSandpaperUsed]}
                  >
                    <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="polishing_paste_id" label="使用抛光膏">
                    <Select placeholder="请选择抛光膏" allowClear>
                      {polishingPaste.map(p => (
                        <Option key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                          {p.name} (库存: {p.stock_quantity}g)
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="polishing_paste_used"
                    label="抛光膏用量(g)"
                    dependencies={['polishing_paste_id']}
                    rules={[validatePasteUsed]}
                  >
                    <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="crack_risk" label="裂纹风险评估">
                <Select placeholder="请选择" allowClear>
                  <Option value="无">无</Option>
                  <Option value="低">低</Option>
                  <Option value="中">中</Option>
                  <Option value="高">高</Option>
                </Select>
              </Form.Item>
              <Form.Item name="notes" label="备注">
                <TextArea rows={3} placeholder="请输入备注信息" />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">确认完成并进入下一阶段</Button>
                  <Button onClick={() => setAdvanceModalVisible(false)}>取消</Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="申请返工"
        open={reworkModalVisible}
        onCancel={() => setReworkModalVisible(false)}
        footer={null}
        width={isMobile ? '95%' : 520}
      >
        <Form form={reworkForm} layout="vertical" onFinish={handleSubmitRework}>
          <Form.Item name="reason" label="返工原因" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="请详细描述返工原因" />
          </Form.Item>
          <Form.Item name="back_to_stage" label="返回阶段" rules={[{ required: true }]}>
            <Select placeholder="请选择返回的阶段">
              <Option value="cutting">切形</Option>
              <Option value="grinding">打磨</Option>
              <Option value="polishing">抛光</Option>
              <Option value="drilling">穿孔</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确认返工</Button>
              <Button onClick={() => setReworkModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkOrders;
