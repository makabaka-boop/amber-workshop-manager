import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Alert, Tag, Grid } from 'antd';
import { ClockCircleOutlined, WarningOutlined, CheckCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { getDashboardStats, getAlerts } from '../api';

const stageNames = {
  cutting: '切形',
  grinding: '打磨',
  polishing: '抛光',
  drilling: '穿孔',
  recheck: '复检',
  completed: '已完成'
};

const { useBreakpoint } = Grid;

const Dashboard = () => {
  const screens = useBreakpoint();
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    stageDistribution: [],
    materialConsumption: [],
    deliveryTrend: [],
    reworkReasons: []
  });
  const [alerts, setAlerts] = useState({ overdueOrders: [], lowStockMaterials: [] });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        getDashboardStats(),
        getAlerts()
      ]);
      setStats(statsRes.data);
      setAlerts(alertsRes.data);
    } catch (error) {
      console.error('获取数据失败', error);
    }
  };

  const stageChartOption = {
    title: { text: '工单阶段分布', left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { bottom: 10, left: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: (params) => `${stageNames[params.name] || params.name}: ${params.value}` },
      data: stats.stageDistribution.map(item => ({
        name: item.name,
        value: item.value
      }))
    }],
    color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272']
  };

  const materialChartOption = {
    title: { text: '耗材消耗排行', left: 'center' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: stats.materialConsumption.map(item => item.name) },
    series: [{
      type: 'bar',
      data: stats.materialConsumption.map(item => item.value),
      itemStyle: { color: '#5470c6' }
    }]
  };

  const trendChartOption = {
    title: { text: '工单交付趋势（近30天）', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: stats.deliveryTrend.map(item => item.date) },
    yAxis: { type: 'value' },
    series: [{
      type: 'line',
      data: stats.deliveryTrend.map(item => item.count),
      smooth: true,
      areaStyle: { opacity: 0.3 },
      itemStyle: { color: '#91cc75' }
    }]
  };

  const reworkChartOption = {
    title: { text: '返工原因占比', left: 'center' },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '60%',
      data: stats.reworkReasons,
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' }
      },
      label: { formatter: '{b}: {c} ({d}%)' }
    }],
    color: ['#ee6666', '#fac858', '#5470c6', '#91cc75', '#73c0de']
  };

  const totalOrders = stats.totalOrders;
  const completedOrders = stats.completedOrders;

  return (
    <div>
      {alerts.overdueOrders.length > 0 && (
        <Alert
          message="超期工单预警"
          description={`有 ${alerts.overdueOrders.length} 个工单已超期，请及时处理！`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Tag color="red">{alerts.overdueOrders.length} 个超期</Tag>
          }
        />
      )}
      {alerts.lowStockMaterials.length > 0 && (
        <Alert
          message="低库存预警"
          description={`有 ${alerts.lowStockMaterials.length} 种耗材库存不足，请及时补货！`}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Tag color="orange">{alerts.lowStockMaterials.length} 种低库存</Tag>
          }
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic 
              title="总工单" 
              value={totalOrders} 
              prefix={<FileTextOutlined />} 
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic 
              title="已完成" 
              value={completedOrders} 
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic 
              title="进行中" 
              value={totalOrders - completedOrders} 
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic 
              title="预警数" 
              value={alerts.overdueOrders.length + alerts.lowStockMaterials.length} 
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card style={{ marginBottom: 16 }}>
            <ReactECharts option={stageChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card style={{ marginBottom: 16 }}>
            <ReactECharts option={materialChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card>
            <ReactECharts option={trendChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card>
            <ReactECharts option={reworkChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
