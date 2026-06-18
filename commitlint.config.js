export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // 新功能
        'fix', // 修复bug
        'docs', // 文档修改
        'style', // 格式、空格、逗号，不影响代码逻辑
        'refactor', // 重构，无bug无新功能
        'perf', // 性能优化
        'test', // 新增测试
        'chore', // 构建、依赖、工具修改
        'revert' // 回滚提交
      ]
    ],
    'subject-full-stop': [0, 'never'],
    'subject-case': [0, 'never']
  }
}
