import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getCustomers, createCustomer } from '../api';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await getCustomers();
      setCustomers(response.data);
    } catch (error) {
      message.error('获取客户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      await createCustomer(values);
      message.success('添加成功');
      setModalVisible(false);
      form.resetFields();
      fetchCustomers();
    } catch (error) {
      message.error('添加失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '客户姓名', dataIndex: 'name', key: 'name' },
    { title: '联系电话', dataIndex: 'phone', key: 'phone' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '地址', dataIndex: 'address', key: 'address', ellipsis: true },
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
        <h2 style={{ margin: 0 }}>客户委托管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          添加客户
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={customers}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="添加客户"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="客户姓名" rules={[{ required: true }]}>
            <Input placeholder="请输入客户姓名" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input.TextArea rows={3} placeholder="请输入地址" />
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

export default Customers;
