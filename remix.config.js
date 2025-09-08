/** @type {import('@remix-run/dev').AppConfig} */
export default {
  tailwind: true,
  serverBuildPath: 'build/server/index.js',
  appDirectory: "app",
  serverDependenciesToBundle: [
    '@remix-run/server-build',
  ],

};