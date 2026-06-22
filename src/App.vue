<template>
  <el-config-provider>
    <el-container class="admin-layout">
      <el-aside class="admin-sidebar" width="236px">
        <div class="brand">
          <div class="brand-mark">A</div>
          <div>
            <strong>管理后台</strong>
            <span>Admin Console</span>
          </div>
        </div>

        <el-menu
          class="side-menu"
          default-active="dashboard"
          background-color="#141a28"
          text-color="#aeb7c8"
          active-text-color="#ffffff"
        >
          <el-menu-item index="dashboard">
            <el-icon><DataBoard /></el-icon>
            <span>工作台</span>
          </el-menu-item>
          <el-menu-item index="users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="orders">
            <el-icon><Tickets /></el-icon>
            <span>订单管理</span>
          </el-menu-item>
          <el-menu-item index="analytics">
            <el-icon><TrendCharts /></el-icon>
            <span>数据分析</span>
          </el-menu-item>
          <el-menu-item index="settings">
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <el-header class="admin-header" height="64px">
          <div>
            <h1>运营工作台</h1>
            <p>统一查看业务指标、待办任务和近期订单</p>
          </div>
          <div class="header-actions">
            <el-input
              v-model="keyword"
              class="search-input"
              placeholder="搜索用户、订单或任务"
              :prefix-icon="Search"
              clearable
            />
            <el-button :icon="Bell" circle />
            <el-avatar :size="36">管</el-avatar>
          </div>
        </el-header>

        <el-main class="admin-main">
          <section class="stat-grid">
            <el-card v-for="item in stats" :key="item.title" shadow="never" class="stat-card">
              <div class="stat-card__top">
                <span>{{ item.title }}</span>
                <el-tag :type="item.type" effect="light">{{ item.change }}</el-tag>
              </div>
              <strong>{{ item.value }}</strong>
              <small>{{ item.desc }}</small>
            </el-card>
          </section>

          <section class="content-grid">
            <el-card shadow="never" class="panel-card order-panel">
              <template #header>
                <div class="panel-header">
                  <span>近期订单</span>
                  <el-button type="primary" plain>导出</el-button>
                </div>
              </template>

              <el-table :data="orders" stripe height="334">
                <el-table-column prop="id" label="订单号" width="120" />
                <el-table-column prop="customer" label="客户" min-width="120" />
                <el-table-column prop="amount" label="金额" width="110" />
                <el-table-column prop="status" label="状态" width="110">
                  <template #default="{ row }">
                    <el-tag :type="row.statusType">{{ row.status }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="date" label="日期" width="130" />
              </el-table>
            </el-card>

            <el-card shadow="never" class="panel-card">
              <template #header>
                <div class="panel-header">
                  <span>快捷操作</span>
                  <el-button :icon="Refresh" text>刷新</el-button>
                </div>
              </template>

              <el-form label-position="top">
                <el-form-item label="任务名称">
                  <el-input v-model="taskForm.name" placeholder="输入任务名称" />
                </el-form-item>
                <el-form-item label="负责人">
                  <el-select v-model="taskForm.owner" placeholder="请选择负责人">
                    <el-option :label="names.zhang" :value="names.zhang" />
                    <el-option :label="names.li" :value="names.li" />
                    <el-option :label="names.wang" :value="names.wang" />
                  </el-select>
                </el-form-item>
                <el-form-item label="优先级">
                  <el-radio-group v-model="taskForm.level">
                    <el-radio-button :label="levels.normal" />
                    <el-radio-button :label="levels.urgent" />
                  </el-radio-group>
                </el-form-item>
                <el-button type="primary" class="full-button">创建任务</el-button>
              </el-form>
            </el-card>
          </section>

          <el-card shadow="never" class="panel-card todo-card">
            <template #header>
              <div class="panel-header">
                <span>今日待办</span>
                <el-tag>4 项</el-tag>
              </div>
            </template>

            <div class="todo-list">
              <div v-for="todo in todos" :key="todo.title" class="todo-item">
                <el-checkbox v-model="todo.done" />
                <div>
                  <strong>{{ todo.title }}</strong>
                  <span>{{ todo.time }}</span>
                </div>
                <el-tag :type="todo.type" effect="plain">{{ todo.label }}</el-tag>
              </div>
            </div>
          </el-card>
        </el-main>
      </el-container>
    </el-container>

    <AIChat />
  </el-config-provider>
</template>

<script setup lang="ts">
  import { reactive, ref } from 'vue'
  import { Bell, DataBoard, Refresh, Search, Setting, Tickets, TrendCharts, User } from '@element-plus/icons-vue'
  import AIChat from './components/aIchat.vue'

  const keyword = ref('')

  const names = {
    zhang: '张明',
    li: '李娜',
    wang: '王强'
  }

  const levels = {
    normal: '普通',
    urgent: '紧急'
  }

  const stats = [
    { title: '今日收入', value: '￥86,420', change: '+12.8%', desc: '较昨日新增 9,800', type: 'success' },
    { title: '活跃用户', value: '12,936', change: '+6.2%', desc: '近 7 日持续增长', type: 'primary' },
    { title: '待处理工单', value: '128', change: '-3.4%', desc: '高优先级 18 条', type: 'warning' },
    { title: '转化率', value: '34.6%', change: '+2.1%', desc: '渠道投放表现稳定', type: 'success' }
  ] as const

  const orders = [
    {
      id: 'DD10086',
      customer: '上海云舟科技',
      amount: '￥12,600',
      status: '已支付',
      statusType: 'success',
      date: '2026-06-12'
    },
    {
      id: 'DD10087',
      customer: '杭州星河贸易',
      amount: '￥8,240',
      status: '处理中',
      statusType: 'warning',
      date: '2026-06-12'
    },
    {
      id: 'DD10088',
      customer: '深圳蓝海网络',
      amount: '￥23,900',
      status: '已发货',
      statusType: 'primary',
      date: '2026-06-11'
    },
    {
      id: 'DD10089',
      customer: '北京启明软件',
      amount: '￥5,180',
      status: '待确认',
      statusType: 'info',
      date: '2026-06-11'
    },
    {
      id: 'DD10090',
      customer: '成都锦程供应链',
      amount: '￥16,300',
      status: '已支付',
      statusType: 'success',
      date: '2026-06-10'
    }
  ]

  const taskForm = reactive({
    name: '',
    owner: '',
    level: levels.normal
  })
  const todos = reactive([
    { title: '审核本周营销预算', time: '09:30', label: '财务', type: 'warning', done: false },
    { title: '跟进重点客户续费', time: '11:00', label: '客户', type: 'primary', done: false },
    { title: '检查库存预警策略', time: '14:00', label: '运营', type: 'success', done: true },
    { title: '整理月度数据报告', time: '16:30', label: '数据', type: 'info', done: false }
  ])
</script>

<style scoped>
  .admin-layout {
    min-height: 100vh;
    background: #f4f6f9;
  }

  .admin-sidebar {
    background: #141a28;
    color: #fff;
    border-right: 0;
  }

  .brand {
    height: 64px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .brand-mark {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: grid;
    place-items: center;
    background: #409eff;
    color: #fff;
    font-weight: 800;
  }

  .brand strong,
  .brand span {
    display: block;
  }

  .brand strong {
    line-height: 1.2;
  }

  .brand span {
    margin-top: 2px;
    color: #7f8da4;
    font-size: 12px;
  }

  .side-menu {
    border-right: 0;
    padding: 12px;
  }

  .side-menu :deep(.el-menu-item) {
    border-radius: 8px;
    margin-bottom: 4px;
  }

  .side-menu :deep(.el-menu-item.is-active) {
    background: #2563eb;
  }

  .admin-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 0 24px;
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
  }

  .admin-header h1 {
    margin: 0;
    color: #1f2937;
    font-size: 20px;
    font-weight: 700;
  }

  .admin-header p {
    margin: 3px 0 0;
    color: #6b7280;
    font-size: 13px;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .search-input {
    width: 260px;
  }

  .admin-main {
    padding: 24px;
  }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }

  .stat-card,
  .panel-card {
    border-radius: 8px;
  }

  .stat-card__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #6b7280;
    font-size: 13px;
  }

  .stat-card strong {
    display: block;
    margin-top: 14px;
    color: #111827;
    font-size: 28px;
    line-height: 1;
  }

  .stat-card small {
    display: block;
    margin-top: 10px;
    color: #8b95a5;
  }

  .content-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 16px;
    margin-top: 16px;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 700;
  }

  .full-button {
    width: 100%;
  }

  .todo-card {
    margin-top: 16px;
  }

  .todo-list {
    display: grid;
    gap: 12px;
  }

  .todo-item {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border: 1px solid #eef0f4;
    border-radius: 8px;
    background: #fbfcfe;
  }

  .todo-item strong,
  .todo-item span {
    display: block;
  }

  .todo-item strong {
    color: #1f2937;
    font-size: 14px;
  }

  .todo-item span {
    margin-top: 3px;
    color: #8b95a5;
    font-size: 12px;
  }

  @media (max-width: 1100px) {
    .stat-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .content-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 760px) {
    .admin-sidebar {
      display: none;
    }

    .admin-header {
      height: auto;
      min-height: 64px;
      align-items: flex-start;
      flex-direction: column;
      padding: 14px 16px;
    }

    .header-actions {
      width: 100%;
    }

    .search-input {
      flex: 1;
      width: auto;
    }

    .admin-main {
      padding: 16px;
    }

    .stat-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
