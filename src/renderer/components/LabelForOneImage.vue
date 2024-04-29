<script lang="ts" setup>
import {nextTick, onUnmounted, ref} from "vue";
import {UploadUserFile} from 'element-plus'
import axios from "axios";
import {CircleClose, Search} from '@element-plus/icons-vue'
import {randomUID, showNotification} from "../utils";

interface ImageLabel {
  prompt: '',
  p_box_threshold: 0.3,
  p_text_threshold: 0.2,

  labels: [{}, {}],
}

const props = defineProps({
  image_file: {
    type: Object as () => UploadUserFile,
    required: true
  },
  image_label: {
    type: Object as () => ImageLabel,
    required: true
  },
  classes: {
    type: Object as () => Object,
    required: true
  }
})

const class_input = ref('')
let class_last = ref('object')
const class_change = (value) => {
  // 对应canvas中的phrases也要改变
  const current_canvas = document.getElementById(current_canvas_uid.value)! as HTMLCanvasElement
  const ctx = current_canvas.getContext('2d')!
  ctx.clearRect(0, 0, current_canvas.width, current_canvas.height)
  ctx.font = '22px Arial'
  ctx.fillStyle = props.classes[value].color
  ctx.fillText(value, 5, 20)
  class_last.value = value
}
const confirm_add_class = () => {
  // 去除前后空格
  class_input.value = class_input.value.trim()
  if (class_input.value === '') {
    showNotification('错误', '类别不能为空', 'error')
    return
  }
  // 先判断是否已经存在
  if (class_input.value in props.classes) {
    showNotification('错误', '该类别已经存在', 'error')
    return
  }
  // 生成随机颜色
  props.classes[class_input.value] = {
    show: true,
    color: `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`
  }
  showNotification('成功', '添加成功', 'success')
  class_input.value = ''
}
const class_search_key = ref('')
const class_search_key_input = (text) => {
  for (let key in props.classes) {
    props.classes[key].show = key.includes(text);
  }
}


const pre_ = (image_file: UploadUserFile, image_label: ImageLabel) => {
  let formData = new FormData()
  formData.append('image_file', image_file.raw)
  formData.append('prompt', image_label.prompt)
  formData.append('p_box_threshold', image_label.p_box_threshold)
  formData.append('p_text_threshold', image_label.p_text_threshold)
  // 10秒超时
  loading.value = true
  axios.post('/infer/one_image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 10 * 1000
  }).then(res => {
    const data = res.data
    // 原来的labels[0]和对应的canvas全部销毁
    for (let uid in image_label.labels[0]) {
      document.getElementById(uid)!.remove()
    }
    // 关闭box信息
    if (current_index.value === 0) {
      current_canvas_uid.value = ''
    }
    // 重置labels[0]
    image_label.labels[0] = {}
    for (let i = 0; i < data.boxes.length; i++) {
      // 为每一个box生成uid
      const uid = randomUID()
      image_label.labels[0][uid] = {
        boxes: data.boxes[i],
        phrases: data.phrases[i]
      }
      // 添加新出现的classes和对应的颜色
      if (!(data.phrases[i] in props.classes)) {
        props.classes[data.phrases[i]] = {
          show: true,
          color: `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`
        }
      }
    }
    // 生成canvas
    create_canvas(0)
  }).catch(err => {
    console.log(err)
  }).finally(() => {
    loading.value = false
  })
}
const loading = ref(false)
const createFileUrl = (image_file: any) => {
  return URL.createObjectURL(image_file.raw)
}
const set_canvas_z_index = (z_index: string) => {
  // 设置canvas的zIndex
  for (let uid in props.image_label.labels[0]) {
    document.getElementById(uid)!.style.zIndex = z_index
  }
  for (let uid in props.image_label.labels[1]) {
    document.getElementById(uid)!.style.zIndex = z_index
  }
}
const current_canvas_uid = ref('')
const current_index = ref(0)
const canvas_click = (index, canvas_uid) => {
  current_canvas_uid.value = canvas_uid
  current_index.value = index
  current_canvas_z_index.value = document.getElementById(canvas_uid)!.style.zIndex
}
nextTick(() => {
  console.log('组件挂载')
  b_main_img.value.onload = img_loaded
  // 设置canvas的的监听事件
  let ctx = board_canvas.value.getContext('2d')!
  let rect = {}; // 存储矩形坐标


  let is_drawing = false
  board_canvas.value.onmousedown = (e) => {
    if (e.button !== 0) {
      return
    }
    console.log('左键按下')
    // 其他所有canvas的zIndex都设置为1 要小于board_canvas的zIndex
    set_canvas_z_index('1')
    // 绘制红色矩形
    ctx.strokeStyle = 'red'
    ctx.lineWidth = 2
    is_drawing = true
    rect['startX'] = e.clientX - board_canvas.value.offsetLeft;
    rect['startY'] = e.clientY - board_canvas.value.offsetTop;

    board_canvas.value.onmousemove = (e) => {
      if (!is_drawing) {
        return
      }
      ctx.clearRect(0, 0, board_canvas.value.width, board_canvas.value.height); // 清除画布
      let endX = e.clientX - board_canvas.value.offsetLeft;
      let endY = e.clientY - board_canvas.value.offsetTop;
      let width = endX - rect['startX'];
      let height = endY - rect['startY'];
      ctx.strokeRect(rect['startX'], rect['startY'], width, height);
    }

  }
  board_canvas.value.onmouseup = (e) => {
    if (e.button !== 0) {
      return
    }
    console.log('左键抬起')

    set_canvas_z_index('5')
    is_drawing = false
    let currentX = e.clientX - board_canvas.value.offsetLeft;
    let currentY = e.clientY - board_canvas.value.offsetTop;

    // 四种情况 终点为左上角，左下角，右下角，右上角
    if (currentX < rect['startX']) {
      [rect['startX'], currentX] = [currentX, rect['startX']]
    }
    if (currentY < rect['startY']) {
      [rect['startY'], currentY] = [currentY, rect['startY']]
    }
    rect['width'] = currentX - rect['startX'];
    rect['height'] = currentY - rect['startY'];
    if (rect['width'] === 0 || rect['height'] === 0) {
      showNotification('错误', '请绘制有效的矩形', 'error')
      return
    }
    // 生成一个新的canvas而不是在board_canvas上绘制
    const uid = randomUID()
    ctx.clearRect(0, 0, board_canvas.value.width, board_canvas.value.height); // 清除画布
    let new_canvas = document.createElement('canvas') as HTMLCanvasElement
    new_canvas.id = uid
    new_canvas.width = rect['width']
    new_canvas.height = rect['height']
    new_canvas.style.position = 'absolute'
    new_canvas.style.zIndex = '5'
    new_canvas.style.left = b_main_img.value.offsetLeft + rect['startX'] + 'px'
    new_canvas.style.top = b_main_img.value.offsetTop + rect['startY'] + 'px'
    new_canvas.style.border = '2px solid red'

    new_canvas.onmouseenter = () => {
      new_canvas.style.backgroundColor = 'rgba(255, 0, 0, 0.3)'
    }
    new_canvas.onmouseleave = () => {
      new_canvas.style.backgroundColor = ''
    }
    // 将phrases设置写入到canvas的内部
    let new_canvas_ctx = new_canvas.getContext('2d')
    new_canvas_ctx.font = '22px Arial'
    new_canvas_ctx.fillStyle = props.classes[class_last.value].color
    new_canvas_ctx.fillText(class_last.value, 5, 20)
    document.body.appendChild(new_canvas)
    new_canvas.onclick = () => {
      canvas_click(1, uid)
    }
    new_canvas.style.cursor = 'pointer'
    // 保存到labels[1] 归一化的数据 center_x, center_y, width, height
    props.image_label.labels[1][uid] = {
      boxes: [
        (rect['startX'] + rect['width'] / 2) / b_main_img.value.width,
        (rect['startY'] + rect['height'] / 2) / b_main_img.value.height,
        rect['width'] / b_main_img.value.width,
        rect['height'] / b_main_img.value.height
      ],
      phrases: class_last.value
    }
    canvas_click(1, uid)
  }

  create_canvas(0)
  create_canvas(1)

  window.onresize = () => {
    justify_board_canvas()
    justify_canvas(0)
    justify_canvas(1)
  }

  window.onscroll = () => {
    justify_board_canvas()
    justify_canvas(0)
    justify_canvas(1)
  }
})
onUnmounted(() => {
  console.log('组件销毁')
  // 销毁所有的canvas
  for (let uid in props.image_label.labels[0]) {
    document.getElementById(uid)?.remove()
  }
  for (let uid in props.image_label.labels[1]) {
    document.getElementById(uid)?.remove()
  }

  window.onresize = null
  window.onscroll = null
})
const b_main_img = ref<HTMLImageElement | null>(null)
const board_canvas = ref<HTMLCanvasElement | null>(null)
const create_canvas = (index) => {
  console.log('create_canvas', index)
  for (let uid in props.image_label.labels[index]) {
    const box = props.image_label.labels[index][uid].boxes
    let centerX = box[0] * b_main_img.value.width
    let centerY = box[1] * b_main_img.value.height
    let width = box[2] * b_main_img.value.width
    let height = box[3] * b_main_img.value.height
    const canvas = document.createElement('canvas')
    canvas.id = uid
    canvas.style.position = 'absolute'
    canvas.style.zIndex = '5'
    canvas.style.left = b_main_img.value.offsetLeft + centerX - width / 2 + 'px'
    canvas.style.top = b_main_img.value.offsetTop + centerY - height / 2 + 'px'
    canvas.width = width
    canvas.height = height
    canvas.style.border = '2px solid red'
    canvas.style.cursor = 'pointer'
    // 绘制phrases
    let ctx = canvas.getContext('2d')!
    ctx.font = '22px Arial'
    ctx.fillStyle = props.classes[props.image_label.labels[index][uid].phrases].color
    ctx.fillText(props.image_label.labels[index][uid].phrases, 5, 20)

    canvas.onmouseenter = () => {
      canvas.style.backgroundColor = 'rgba(255, 0, 0, 0.3)'
    }
    canvas.onmouseleave = () => {
      canvas.style.backgroundColor = ''
    }
    canvas.onclick = () => {
      canvas_click(index, uid)
    }
    document.body.appendChild(canvas)
  }

}
const justify_canvas = (index) => {
  console.log('justify_canvas', index)
  for (let uid in props.image_label.labels[index]) {
    // 注意phrases的位置
    const box = props.image_label.labels[index][uid].boxes
    let centerX = box[0] * b_main_img.value.width
    let centerY = box[1] * b_main_img.value.height
    let width = box[2] * b_main_img.value.width
    let height = box[3] * b_main_img.value.height
    const canvas = document.getElementById(uid) as HTMLCanvasElement
    canvas.style.left = b_main_img.value.offsetLeft + centerX - width / 2 + 'px'
    canvas.style.top = b_main_img.value.offsetTop + centerY - height / 2 + 'px'
    canvas.width = width
    canvas.height = height

    // 绘制phrases
    let ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.font = '22px Arial'
    ctx.fillStyle = props.classes[props.image_label.labels[index][uid].phrases].color
    ctx.fillText(props.image_label.labels[index][uid].phrases, 5, 20)
  }

}
const justify_board_canvas = () => {
  // 这个当img的位置发生变化时会调用
  // 使board_canvas覆盖img
  const img = b_main_img.value
  const canvas = board_canvas.value
  if (img && canvas) {
    canvas.width = img.width
    canvas.height = img.height
    canvas.style.left = img.offsetLeft + 'px'
    canvas.style.top = img.offsetTop + 'px'
  }
}

function img_loaded() {
  console.log('图像加载成功')
  justify_board_canvas()
  justify_canvas(0)
  justify_canvas(1)

}

const removeLabel = () => {
  if (current_canvas_uid.value === '') {
    return
  }
  document.getElementById(current_canvas_uid.value)!.remove()
  if (current_index.value === 0) {
    delete props.image_label.labels[0][current_canvas_uid.value]
  } else {
    delete props.image_label.labels[1][current_canvas_uid.value]
  }
  current_canvas_uid.value = ''
}
const moveToTop = () => {
  if (current_canvas_uid.value === '') {
    return
  }
  const canvas = document.getElementById(current_canvas_uid.value)!
  canvas.style.zIndex = Number(canvas.style.zIndex) + 1 + ''
  current_canvas_z_index.value = canvas.style.zIndex
}
const moveToBottom = () => {
  if (current_canvas_uid.value === '') {
    return
  }
  const canvas = document.getElementById(current_canvas_uid.value)!
  canvas.style.zIndex = Math.max(Number(canvas.style.zIndex) - 1, 3) + ''
  current_canvas_z_index.value = canvas.style.zIndex
}
const current_canvas_z_index = ref('5')

const clearFileLabel = () => {
  // 原来的labels[0]和labels[1]全部销毁
  for (let i = 0; i < 2; i++) {
    for (let uid in props.image_label.labels[i]) {
      document.getElementById(uid)!.remove()
    }
    // 关闭box信息
    props.image_label.labels[i] = {}
  }
  current_canvas_uid.value = ''
}
</script>

<template>
  <div class="common-layout a">
    <el-container class="b">
      <el-main class="b-main">
        <div class="b-main-image">
          <img
              ref="b_main_img"
              style="max-height: 100% ; max-width: 100%; object-fit: contain;"
              alt="请选择你的图片"
              :src="createFileUrl(image_file)">
        </div>
        <canvas ref="board_canvas" id="board-canvas"></canvas>
        <div class="b-main-label-manage"
             v-if="current_canvas_uid">
          <div
              style="width: 100%; display: flex; flex-direction: row; flex-wrap: nowrap; margin-bottom: 10px; justify-content: space-between; align-items: center">
            <el-tag :type="current_index === 0 ? 'primary' : 'success'" size="large">
              {{ current_index === 0 ? '预标注' : '人工标注' }}
            </el-tag>
            <el-icon style="cursor: pointer" @click="current_canvas_uid = ''">
              <CircleClose/>
            </el-icon>
          </div>

          <div
              style="display: flex; flex-direction: row; flex-wrap: nowrap; margin-bottom: 10px; justify-content: center; align-items: center">
            <el-button type="danger" @click="removeLabel">删除</el-button>
            <el-button type="primary" @click="moveToTop">置于上层</el-button>
            <el-tag type="info" style="margin-left: 5px; margin-right: 5px">层级：{{ current_canvas_z_index }}</el-tag>
            <el-button type="warning" @click="moveToBottom">置于下层</el-button>
          </div>
          <div style="display: flex; flex-direction: column; margin-bottom: 5px; width: 100%;">
            <el-input
                v-model="class_search_key"
                style="width: 100%"
                placeholder="搜索类别 | 标签"
                :prefix-icon="Search"
                @input="class_search_key_input"/>
            <el-radio-group
                @change="class_change"
                v-model="image_label.labels[current_index][current_canvas_uid].phrases"
                style="display: flex; flex-direction: row; flex-wrap: wrap; justify-content: center; align-items: center; margin-bottom: 5px">
              <el-radio v-for="(value, key) in classes" v-show="value.show" :key="key" :value="key">{{ key }}</el-radio>
            </el-radio-group>
            <el-popover placement="right" :width="250" trigger="hover">
              <template #reference>
                <el-button type="success">手动添加</el-button>
              </template>
              <div style="display: flex; flex-direction: row; flex-wrap: nowrap; width: 100%;">
                <el-input style="flex: 3" placeholder="类别 | 标签" v-model="class_input"></el-input>
                <el-button style="flex: 1" type="info" @click="confirm_add_class">添加</el-button>
              </div>
            </el-popover>

          </div>
          <el-form
              label-position="right"
              label-width="auto"
              :model="image_label.labels[current_index][current_canvas_uid]"
              style="width: 80%">
            <el-form-item label="x中心">
              <el-input v-model="image_label.labels[current_index][current_canvas_uid].boxes[0]" disabled/>
            </el-form-item>
            <el-form-item label="y中心">
              <el-input v-model="image_label.labels[current_index][current_canvas_uid].boxes[1]" disabled/>
            </el-form-item>
            <el-form-item label="宽度">
              <el-input v-model="image_label.labels[current_index][current_canvas_uid].boxes[2]" disabled/>
            </el-form-item>
            <el-form-item label="高度">
              <el-input v-model="image_label.labels[current_index][current_canvas_uid].boxes[3]" disabled/>
            </el-form-item>
          </el-form>
          <el-button style="width: 100%" type="danger" @click="clearFileLabel">清空当前文件标注信息</el-button>
        </div>
      </el-main>

      <el-footer class="b-footer"
                 v-loading="loading"
                 element-loading-text="任务处理中..."
                 element-loading-svg-view-box="-10, -10, 50, 50"
                 element-loading-background="rgba(50, 50, 50, 0.8)">
        <div class="b-footer-input-box">
          <div>
            <span style="color: red"> * </span>提示词
          </div>
          <el-input
              v-model="image_label.prompt"
              style="width: 100%"
              :autosize="{ minRows: 3, maxRows: 5 }"
              type="textarea"
              placeholder="请输入目标提示词，例如：&#10people in white.&#10black-haired cat.&#10The dog on the far left."/>
        </div>
        <div class="b-footer-number-box">
          <div class="b-footer-number-box-tooltip">
            <span style="color: red"> * </span>阈值控制
          </div>
          <el-form label-width="auto" label-position="left" class="b-footer-number-box-arg">
            <el-form-item label="方框阈值">
              <el-input-number v-model="image_label.p_box_threshold" :precision="2" :step="0.05" :max="1" :min="0"/>
            </el-form-item>
            <el-form-item label="文本阈值">
              <el-input-number v-model="image_label.p_text_threshold" :precision="2" :step="0.05" :max="1" :min="0"/>
            </el-form-item>
          </el-form>
        </div>
        <div class="b-footer-button-box">
          <el-button type="primary" @click="pre_(image_file, image_label)">预标注</el-button>
        </div>
      </el-footer>
    </el-container>
  </div>
</template>

<style scoped>
#board-canvas {
  position: absolute;
  z-index: 2;
}

.a {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

.b {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.b-main {
  height: 100%;
  min-height: 500px;
  min-width: 500px;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;

  .b-main-image {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 4;

  }

  .b-main-label-manage {
    width: 100%;
    flex: 1;
    margin-left: 5px;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
  }
}

.b-footer {
  margin: 0;
  padding: 0;
  height: 15%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  .b-footer-input-box {
    flex: 3;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
  }

  .b-footer-number-box {
    flex: 2;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .b-footer-number-box-tooltip {
      margin-bottom: 5px;
    }

    .b-footer-number-box-arg {
      margin-bottom: -20px;
    }
  }

  .b-footer-button-box {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
}
</style>