// 随机生成当前时间（s）_随机数（6位）
import {ElNotification} from "element-plus";
export function randomUID() {
  return Date.now() + '_' + Math.random().toString().slice(2, 8);
}
export const showNotification = (title, message, type, duration = 2000, showClose = true, position = 'top-right') => {
  ElNotification({
    title: title,
    message: message,
    type: type,
    duration: duration,
    showClose: showClose,
    position: position
  })
}