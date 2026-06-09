import { useState, useEffect } from 'react';
import { Table, message, Tag } from 'antd';
import { getSandpaper } from '../api';

const Sandpaper = () => {
  const [sandpaper, setSandpaper] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSandpaper();
  }, []);

  const fetchSandpaper = async () => {
    setLoading(true);
    try {
      const response = await getSandpaper();
      setSandpaper(response.data);
    } catch (error) {
      message.error('获取砂纸列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getGritLevel = (grit) => {
    if (grit <= 400) return { color: 'red', text: '粗磨' };
    if (grit <= 1000) return { color: 'orange', text: '中磨' };
    if (grit <= 3000) return { color: 'blue', text: '细磨' };
    return { color: 'green', text: '精磨' };
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { 
      title: '粒度(目)', 
      dataIndex: 'grit', 
      key: 'grit',
      sorter: (a, b) => a.grit - b.grit
    },
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '适用阶段',
      key: 'level',
      render: (_, record) => {
        const level = getGritLevel(record.grit);
        return <Tag color={level.color}>{level.text}</Tag>;
      }
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>砂纸粒度配置</h2>
        <p style={{ color: '#666', marginTop: 8 }}>系统预置的砂纸粒度规格，用于工单处理时记录耗材使用</p>
      </div>
      <Table
        columns={columns}
        dataSource={sandpaper}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
};

export default Sandpaper;
