/**
 * TreeNode — 文件树节点类型
 *
 * 用于文件浏览器中构建目录树结构的通用节点类型
 *
 * @property name     - 文件/文件夹名
 * @property type     - 节点类型：file | folder
 * @property path     - 唯一路径标识（如 /src/main.ts）
 * @property children - 子节点（仅文件夹有）
 * @property language - 文件语言（用于显示语言标签）
 * @property handle   - 文件系统句柄（仅文件有，用于异步读取内容）
 */
export interface TreeNode {
  name: string
  type: 'file' | 'folder'
  path: string
  children?: TreeNode[]
  language?: string
  handle?: FileSystemFileHandle
}
