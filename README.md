# Vue 3 + TypeScript + Vite

要修改 package.json / eslint.config.js，需要先解锁文件：
powershell
git update-index --no-assume-unchanged package.json eslint.config.js

改完再重新锁定防止被 prettier 覆盖：
powershell
git update-index --assume-unchanged package.json eslint.config.js
