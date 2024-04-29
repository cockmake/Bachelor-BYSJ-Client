<script lang="ts" setup>
import {ref} from 'vue'
import {ElNotification, genFileId, UploadInstance, UploadProps, UploadRawFile} from 'element-plus'
import axios from "axios";
import CanvasWithImage from "../components/CanvasWithImage.vue"

const upload = ref<UploadInstance>()
const uploadFileUrl = ref()
const img = ref()
const prompt = ref('')

const canvas_with_image = ref()


const handleChange: UploadProps['onChange'] = (file) => {
  // 显示新的图片
  if (file.status === 'ready') {
    uploadFileUrl.value = URL.createObjectURL(file.raw)
    canvas_with_image.value.resetResult()
  }
}
const handleExceed: UploadProps['onExceed'] = (files) => {
  upload.value!.clearFiles()
  const file = files[0] as UploadRawFile
  file.uid = genFileId()
  upload.value!.handleStart(file)
}

const submitUpload = (file: any) => {
  if (!prompt.value) {
    ElNotification({
      title: '错误',
      message: '请填写提示词',
      type: 'error',
      duration: 3000,
      position: 'top-right',
      showClose: true
    })
    return
  }
  let formData = new FormData()
  formData.append('image_file', file.raw)
  formData.append('prompt', prompt.value)
  formData.append('p_box_threshold', p_box_threshold.value)
  formData.append('p_text_threshold', p_text_threshold.value)
  // 10秒超时
  loading.value = true
  axios.post('/infer/one_image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 10 * 1000
  }).then(res => {
    console.log(res)
    let data = res.data
    canvas_with_image.value.set_result_and_init(data.boxes, data.logits, data.phrases)
  }).catch(err => {
    console.log(err)
  }).finally(() => {
    loading.value = false
  })
}
const p_text_threshold = ref(0.20)
const p_box_threshold = ref(0.30)
const loading = ref(false)

</script>

<template>
  <div class="common-layout a">
    <el-container class="b">
      <el-aside class="b-aside"
                v-loading="loading"
                element-loading-text="任务处理中..."
                element-loading-svg-view-box="-10, -10, 50, 50"
                element-loading-background="rgba(50, 50, 50, 0.8)">
        <div class="b-aside-input-box">
          <div>
            <span style="color: red"> * </span>提示词
          </div>
          <el-input
              v-model="prompt"
              style="width: 80%"
              :autosize="{ minRows: 4, maxRows: 6 }"
              type="textarea"
              placeholder="请输入目标提示词，例如：&#10people in white.&#10black-haired cat.&#10The dog on the far left."/>
        </div>

        <div class="b-aside-image-box">
          <div>
            <span style="color: red"> * </span>图片
          </div>

          <div class="b-aside-image">
            <img
                ref="img"
                style="height: 100%; width: 100%; object-fit: contain;"
                alt="请选择你的图片"
                :src="uploadFileUrl">
          </div>
        </div>

        <div class="b-aside-number-box">
          <div>
            参数控制
          </div>
          <el-form label-width="auto" label-position="left">
            <el-form-item label="方框阈值">
              <el-input-number v-model="p_box_threshold" :precision="2" :step="0.05" :max="1" :min="0"/>
            </el-form-item>
            <el-form-item label="文本阈值">
              <el-input-number v-model="p_text_threshold" :precision="2" :step="0.05" :max="1" :min="0"/>
            </el-form-item>
          </el-form>
        </div>

        <el-upload class="b-aside-upload-box"
                   ref="upload"
                   :limit="1"
                   accept="image/*"
                   :on-change="handleChange"
                   :on-exceed="handleExceed"
                   :auto-upload="false">
          <template #file="scope">
            <el-button class="ml-3" type="success" @click="submitUpload(scope.file)">
              开始运行
            </el-button>
          </template>
          <template #trigger>
            <el-button type="warning">选择图片</el-button>
          </template>
        </el-upload>
      </el-aside>
      <el-main class="b-main">
        <CanvasWithImage ref="canvas_with_image" :fileUrl="uploadFileUrl"/>
      </el-main>
    </el-container>
  </div>
</template>

<style scoped>
.a {
  height: 100%;
  width: 100%;
}

.b {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

.b-aside {
  padding: 0;
  margin: 0;
  background: aliceblue;
  width: 35%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;

  .b-aside-input-box {
    flex: 2;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
  }

  .b-aside-image-box {
    flex: 6;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;

    .b-aside-image {
      display: flex;
      justify-content: center;
      align-items: center;
      max-height: 54vh;
    }
  }

  .b-aside-number-box {
    flex: 2;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
  }

  .b-aside-upload-box {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
  }
}

.b-main {
  padding: 0;
  margin-left: 5px;
}
</style>