<script>
import moment from 'moment'
import { CloseBold, Select } from '@element-plus/icons-vue'
import countDown from '@/components/countDown'

export default {
    name: 'StatusStepsModel',
    components: {
        CountDown: countDown,
        CloseBold,
        Select,
    },
    props: {
        item: {
            type: Object,
            default: () => { },
        },
    },
    data() {
        return {
            list: [],
            active: 0,
        }
    },
    watch: {
        item: {
            handler() {
                this.loadData()
            },
        },
    },
    mounted() {
    // this.loadData()
    },

    methods: {
        moment,
        loadData() {
            const { orderStatus } = this.item

            switch (orderStatus) {
                case 1:
                    this.active = 1
                    this.successFormat()
                    break
                case 2:
                    this.active = 2
                    this.successFormat()
                    break
                case 4:
                    this.active = 3
                    this.successFormat()
                    break
                case 6:
                case 7:
                    this.active = 4
                    this.successFormat()
                    break
                case 3:
                case 8:
                case 9:
                    this.active = 1
                    this.errorFormat()
                    break
                case 5:
                case 10:
                case 11:
                    this.active = 2
                    this.errorFormat()
                    break

                default:
                    break
            }
        },
        // 成功格式
        successFormat() {
            const { xizhaoOrderStatusFlows, orderStatus } = this.item
            // 下面不能用for循环, 会出现 当前不是object对象的报错
            const type = {
                1: {
                    num: 1, // 数字
                    statusName: '已提交',
                    title: '', // 标题
                    remarks: '', // 备注
                    isCurrent: true, // 当前是否状态的值
                    timeData: '', // 倒计时需要的时间
                    isCountdown: false, // 是否倒计时
                    className: '', // class名
                    timeFormat: false, // 倒计时格式化
                    isError: false, // 当前是否错误状态
                },
                2: {
                    num: 2,
                    statusName: '待确认',
                    title: '',
                    remarks: '',
                    isCurrent: false,
                    timeData: '',
                    isCountdown: false,
                    className: '',
                    timeFormat: true,
                    isError: false,
                    formatData: {
                        day: true,
                        hour: true,
                        min: true,
                        sec: true,
                    },
                },
                3: {
                    num: 3,
                    statusName: '待发货',
                    title: '',
                    remarks: '',
                    isCurrent: false,
                    timeData: '',
                    isCountdown: false,
                    className: '',
                    timeFormat: false,
                    isError: false,
                },
                4: {
                    num: 4,
                    statusName: '待收货',
                    title: '',
                    remarks: '',
                    isCurrent: false,
                    timeData: '',
                    isCountdown: false,
                    className: '',
                    timeFormat: false,
                    isError: false,
                    formatData: {
                        day: true,
                        hour: true,
                        min: false,
                        sec: false,
                    },
                },
                5: {
                    num: 5,
                    statusName: '已完成',
                    title: '',
                    remarks: '',
                    isCurrent: false,
                    timeData: '',
                    isCountdown: false,
                    className: '',
                    timeFormat: false,
                    isError: false,
                },
            }

            xizhaoOrderStatusFlows.forEach((val) => {
                const { statusTime, extend, extendTime, status } = val
                switch (status) {
                    case 1:
                        type[1].title = `<div class='text-[#FFA600]'>订单创建: ${statusTime}</div>`

                        if (orderStatus == 1) {
                            Object.assign(type[2], {
                                statusName: '待确认',
                                isCurrent: false,
                                title: `<div class='text-[#999999]'>待供应商确认: `,
                                isCountdown: true,
                                timeData: extendTime,
                                className: 'text-[#F33333]',
                            })
                        }

                        break
                    case 2:
                        Object.assign(type[2], {
                            statusName: '已确认',
                            remarks: extend,
                            title: `<div class='text-[#FFA600]'>确认时间: ${statusTime}</div>`,
                            isCurrent: true,
                        })

                        if (orderStatus == 2) {
                            Object.assign(type[3], {
                                statusName: '待发货',
                                title: `<div >预计发货时间: ${this.moment(extendTime).format(
                                    'YYYY-MM-DD',
                                )}</div>`,
                                isCurrent: false,
                            })
                        }
                        break
                    case 4:
                        Object.assign(type[3], {
                            statusName: '已发货',
                            remarks: `发货类型: ${extend}`,
                            title: `<div class='text-[#FFA600]'>发货时间: ${statusTime}</div>`,
                            isCurrent: true,
                        })

                        if (orderStatus == 4) {
                            Object.assign(type[4], {
                                statusName: '待收货',
                                title: `<div class="text-[#999999]">剩余自动收货时间:</div>`,
                                isCurrent: false,
                                isCountdown: true,
                                timeData: extendTime,
                                className: 'text-[#999999]',
                            })
                        }
                        break
                    case 6:
                    case 7:
                        Object.assign(type[4], {
                            statusName: '已收货',
                            remarks: `收货类型: ${extend}`,
                            title: `<div class='text-[#FFA600]'>收货时间: ${statusTime}</div>`,
                            isCurrent: true,
                        })
                        Object.assign(type[5], {
                            isCurrent: true,
                        })
                        break

                    default:
                        break
                }
            })

            this.list = Object.keys(type).map(val => type[val])
        },
        // 失败格式格式
        errorFormat() {
            const { xizhaoOrderStatusFlows, submitTime } = this.item
            const type = {
                1: {
                    num: 1,
                    statusName: '已提交',
                    title: `<div class='text-[#FFA600]'>订单创建: ${submitTime}</div>`,
                    remarks: '',
                    isCurrent: true,
                    timeData: '',
                    isCountdown: false,
                    className: '',
                    timeFormat: false,
                    isError: false,
                },
                2: {
                    num: 2,
                    statusName: '',
                    title: '',
                    remarks: '',
                    isCurrent: true,
                    timeData: '',
                    isCountdown: false,
                    className: '',
                    timeFormat: false,
                    isError: false,
                },
            }

            xizhaoOrderStatusFlows.forEach((val) => {
                const { statusTime, extend, status } = val
                switch (status) {
                    case 2:
                        Object.assign(type[2], {
                            statusName: '已确认',
                            remarks: extend,
                            title: `<div class='text-[#FFA600]'>确认时间: ${statusTime}</div>`,
                            isCurrent: true,
                        })

                        break

                    case 3:
                        Object.assign(type[2], {
                            statusName: '超时未处理',
                            remarks: extend,
                            title: '',
                            isCurrent: true,
                            isError: true,
                        })
                        break

                    case 8:
                        Object.assign(type[2], {
                            statusName: '已拒绝',
                            title: `<div >拒绝时间: ${statusTime}</div>
              <div >拒绝原因: ${extend}</div>`,
                            remarks: '',
                            isCurrent: true,
                            isError: true,
                        })
                        break
                    case 9:
                        Object.assign(type[2], {
                            statusName: '已取消',
                            title: `<div >取消时间: ${statusTime}</div>
              <div >取消原因: ${extend}</div>`,
                            remarks: '',
                            isCurrent: true,
                            isError: true,
                        })
                        break
                    case 5:
                        type[2].isError = false
                        type[3] = {
                            statusName: '超时未处理',
                            remarks: '',
                            title: `<div >超时原因: ${extend}</div>`,
                            isCurrent: true,
                            num: 2,
                            timeData: '',
                            isCountdown: false,
                            className: '',
                            timeFormat: false,
                            isError: true,
                        }
                        break
                    case 10:
                        type[2].isError = false
                        type[3] = {
                            statusName: '已取消',
                            remarks: '',
                            title: `<div >取消时间: ${statusTime}</div>
              <div >取消原因: ${extend}</div>`,
                            isCurrent: true,
                            num: 2,
                            timeData: '',
                            isCountdown: false,
                            className: '',
                            timeFormat: false,
                            isError: true,
                        }

                        break
                    case 11:
                        type[2] = {
                            statusName: '已关闭',
                            remarks: '',
                            title: `<div >关闭时间: ${statusTime}</div>
              <div >关闭原因: ${extend}</div>`,
                            isCurrent: true,
                            num: 2,
                            timeData: '',
                            isCountdown: false,
                            className: '',
                            timeFormat: false,
                            isError: true,
                        }

                        break

                    default:
                        break
                }
            })

            this.list = Object.keys(type).map(val => type[val])
        },
    },
}
</script>

<template>
    <div class="steps-box">
        <el-steps :active="active" align-center>
            <el-step v-for="(child, i) in list" :key="i">
                <template #title>
                    <span class="title">
                        <span v-if="child.isError" :class="[child.isCurrent ? 'text-[#F33333]' : '']">{{ child.statusName }}
                        </span>
                        <span v-else :class="[child.isCurrent ? 'text-[#FFA600]' : '']">{{
                            child.statusName
                        }}</span>
                    </span>
                </template>

                <template #icon>
                    <div class="icon text-[#fff]">
                        <span
                            v-if="child.isCurrent" class="flex text-[40px] b-radius-half width-height-40 items-center justify-center overflow-hidden"
                            :class="child.isError ? 'bg-[#F33333]' : 'bg-main'"
                        >
                            <!-- <i class="el-icon-error text-[#ff0000]" v-if="child.isError"></i> -->

                            <span
                                v-if="child.isError"
                                class="flex items-center justify-center "
                            >
                                <el-icon :size="20"><CloseBold /></el-icon>
                            </span>

                            <!-- <i class="el-icon-success text-[#FFA600]" v-else></i> -->
                            <span v-else class="flex items-center justify-center">
                                <el-icon :size="20"><Select /></el-icon>
                            </span>
                        </span>
                        <span v-else class="text-[14px] font-[800]" :class="[child.isCurrent ? 'color-000' : '']">
                            {{ child.num }}
                        </span>
                    </div>
                </template>

                <template #description>
                    <div class="is-finish">
                        <div v-if="child.isCountdown">
                            <span v-html="child.title" />
                            <CountDown
                                :class="child.className" :end-time="`${new Date(child.timeData).getTime() / 1000} `" end-text=""
                                :is-formats="child.timeFormat" :format-data="child.formatData"
                            />
                        </div>
                        <div v-else v-html="child.title" />
                        <div class="text-[#999999]">
                            {{ child.remarks }}
                        </div>
                    </div>

                    <!-- <div class="text-[#999999]" v-else>备注内容:{{ child.remarks }}</div> -->
                </template>
            </el-step>
        </el-steps>
    </div>
</template>

<style lang="scss" scoped>
.b-radius-half {
  border-radius: 50%;
}
.color-000 {
  color: #000;
}
::v-deep .el-step {
  &.is-horizontal {
    .el-step__main {
      .title {
        color: #999999;
      }
    }
  }

  .el-step__head.is-finish {
    color: #ffcd36;
    border: #ffcd36;

    .is-text {
      color: #999;
      border-color: #333;
    }

    .el-step__line {
      background-color: #ffcd36;
    }
  }

  .el-step__head.is-wait {
    border: #e0e0e0;
    color: #e0e0e0;
  }

  .el-step__head.is-process {
    .el-step__line {
      background-color: #e0e0e0;
    }
  }

  .el-step__head.is-finish {
    .is-text {
      border: 0;
    }
  }

  .el-step__title.is-finis {
    color: #ffcd36;
    border: #ffcd36;
  }

  .el-step__description.is-finish {
    color: #333;
    border-color: #333;
  }

  .el-step__line {
    top: 20px;
  }

  .el-step__icon {
    width: 40px;
    height: 40px;
    background: #F5F5F5;

  }
}

.steps-box {
  padding-top: 80px;
  padding-bottom: 30px;
  background-color: #f5f5f5;
  border-radius: 10px;
}

.title {
  position: relative;
  height: 20px;

  span {
    font-weight: bold;
    position: absolute;
    top: -80px;
    left: 50%;
    width: 120px;
    margin-left: -60px;
    text-align: center;
  }
}

.icon {
  width: 100%;
  span {
    height: 40px;
    line-height: 40px;
  }
}
</style>
