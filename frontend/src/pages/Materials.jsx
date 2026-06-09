import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, InputNumber, message, Space, Tag, Card } from 'antd';
import { EditOutlined, WarningOutlined } from '@ant-design/icons';
import { getPolishingPaste, updatePolishingPaste } from '../api';

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const response = await getPolishingPaste();
      setMaterials(response.data);
    } catch (error) {
      message.error('获取耗材列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    form.setFieldsValue({
      stock_quantity: material.stock_quantity,
      min_stock: material.min_stock
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      await updatePolishingPaste(editingMaterial.id, values);
      message.success('更新成功');
      setModalVisible(false);
      fetchMaterials();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { 
      title: '类型', 
      dataIndex: 'type', 
      key: 'type',
      render: (type) => {
        const typeMap = {
          coarse: { color: 'red', text: '粗磨' },
          medium: { color: 'orange', text: '中磨' },
          fine: { color: 'blue', text: '细磨' },
          final: { color: 'green', text: '精抛' }
        };
        const t = typeMap[type] || { color: 'default', text: type };
        return <Tag color={t.color}>{t.text}</Tag>;
      }
    },
    { 
      title: '当前库存', 
      dataIndex: 'stock_quantity', 
      key: 'stock_quantity',
      render: (value, record) => {
        const isLow = value < record.min_stock;
        return (
          <Space>
            <span style={{ color: isLow ? '#ff4d4f' : 'inherit', fontWeight: isLow ? 'bold' : 'normal' }}>
              {value} {record.unit}
            </span>
            {isLow && <WarningOutlined style={{ color: '#ff4d4f' }} />}
          </Space>
        );
      }
    },
    { title: '最低库存预警', dataIndex: 'min_stock', key: 'min_stock', render: (v, r) => `${v} ${r.unit}` },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
          编辑库存
        </Button>
      )
    }
  ];

  const lowStockCount = materials.filter(m => m.stock_quantity < m.min_stock).length;

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>抛光膏库存管理</h2>
        {lowStockCount > 0 && (
          <Tag color="red" icon={<WarningOutlined />}>
            {lowStockCount} 种耗材库存不足
          </Tag>
        )}
      </div>
      <Table
        columns={columns}
        dataSource={materials}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 700 }}
      />

      <Modal
        title="编辑库存"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="耗材名称">
            <span>{editingMaterial?.name}</span>
          </Form.Item>
          <Form.Item name="stock_quantity" label="当前库存量" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} addonAfter={editingMaterial?.unit || 'g'} />
          </Form.Item>
          <Form.Item name="min_stock" label="最低库存预警值" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} addonAfter={editingMaterial?.unit || 'g'} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Materials;
