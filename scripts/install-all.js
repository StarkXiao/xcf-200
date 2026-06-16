const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

function installDependencies(dir, name) {
  const nodeModulesPath = path.join(dir, 'node_modules');
  const hasNodeModules = fs.existsSync(nodeModulesPath);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 正在安装 [${name}] 依赖...`);
  console.log(`📍 目录: ${dir}`);
  if (hasNodeModules) {
    console.log(`ℹ️  检测到 node_modules，将执行增量安装`);
  }
  console.log('='.repeat(60) + '\n');

  try {
    execSync('npm install --no-fund', {
      cwd: dir,
      stdio: 'inherit',
      env: process.env,
    });
    console.log(`\n✅ [${name}] 依赖安装完成！`);
    return true;
  } catch (error) {
    console.error(`\n❌ [${name}] 依赖安装失败！`);
    console.error(error.message);
    return false;
  }
}

function main() {
  console.log('\n' + '⭐'.repeat(40));
  console.log('  🌟 星邮局 - 全栈依赖自动安装脚本 🌟');
  console.log('⭐'.repeat(40));

  const backendOk = installDependencies(backendDir, '后端服务 (Express)');
  const frontendOk = installDependencies(frontendDir, '前端应用 (React + Vite)');

  console.log('\n' + '='.repeat(60));
  if (backendOk && frontendOk) {
    console.log('🎉 所有依赖安装成功！');
    console.log('');
    console.log('🚀 启动项目:');
    console.log('   开发模式:  npm run dev');
    console.log('   生产模式:  npm run start');
    console.log('');
    console.log('📝 演示账号:');
    console.log('   邮箱: stardust@example.com');
    console.log('   密码: 123456');
    console.log('='.repeat(60) + '\n');
    process.exit(0);
  } else {
    console.log('⚠️  部分依赖安装失败，请检查上方日志后手动重试:');
    if (!backendOk) console.log('   cd backend && npm install');
    if (!frontendOk) console.log('   cd frontend && npm install');
    console.log('='.repeat(60) + '\n');
    process.exit(1);
  }
}

main();
