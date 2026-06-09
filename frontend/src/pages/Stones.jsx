import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message, Space, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getRoughStones, createRoughStone } from '../api';

const Stones = () => {
  const [stones, setStones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchStones();
  }, []);

  const fetchStones = async () => {
    setLoading(true);
    try {
      const response = await getRoughStones();
      setStones(response.data);
    } catch (error) {
      message.error('获取原石列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      await createRoughStone(values);
      message.success('添加成功');
      setModalVisible(false);
      form.resetFields();
      fetchStones();
    } catch (error) {
      message.error('添加失败');
    }
  };

  const columns = [
    { title: '原石编号', dataIndex: 'stone_no', key: 'stone_no' },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '产地', dataIndex: 'origin', key: 'origin' },
    { title: '初始重量(g)', dataIndex: 'initial_weight', key: 'initial_weight' },
    { title: '颜色', dataIndex: 'color', key: 'color' },
    { title: '透明度', dataIndex: 'transparency', key: 'transparency' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleString()
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>原石档案管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          添加原石
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={stones}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="添加原石"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="stone_no" label="原石编号" rules={[{ required: true }]}>
            <Input placeholder="请输入原石编号" />
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input placeholder="请输入名称" />
          </Form.Item>
          <Form.Item name="origin" label="产地">
            <Input placeholder="请输入产地" />
          </Form.Item>
          <Form.Item name="initial_weight" label="初始重量(g)" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="请输入重量" />
          </Form.Item>
          <Form.Item name="color" label="颜色">
            <Input placeholder="请输入颜色" />
          </Form.Item>
          <Form.Item name="transparency" label="透明度">
            <Input placeholder="请输入透明度" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Stones;
