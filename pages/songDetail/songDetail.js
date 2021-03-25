// pages/songDetail/songDetail.js
import PubSub from 'pubsub-js'
import moment from 'moment'
import request from '../../utils/request'
//获取全局实例：因为退出正在播放的音乐再重新进去会重置appdata中的songDeatil数据
const appInstance = getApp();/* 获取全局的app的实例 */
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isPlay: false,
    song:{},//歌曲详情对象
    musicId:'',//音乐id
    musicLink: '',//音乐的链接
    currentTime:'00:00',//实时时间
    durationTime:'00:00',//总时长
    currentWidth:0,//实时进度条的宽度
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //options:用于接收路由跳转的query参数
    //原生小程序路由传参，传参数字符串长度有限制，太长自动截取
    // console.log(typeof options.song);
    let musicId= options.musicId;
    this.setData({
      musicId
    })
    //获取音乐详情
    this.getMusicInfo(musicId);
    /* 
      问题：如果用户操作系统的控制音乐播放暂停按钮，页面不知道，导致页面显示是否播放的状态和真实的音乐播放状态不一致
      解决方案:
      1.通过控制音频的实例backgroundAudioManager 去监视音乐播放暂停
    */
    //判断当前页面音乐是否再播放
    if(appInstance.globalData.isMusicPlay && appInstance.globalData.musicId=== musicId){
      //修改当前播放音乐状态为true
      this.setData({
        isPlay:true
      })
    }

  //创建控制音乐播放的实例
  //let 有块级作用域，要放在外面，因为if和else都要用这个变量
  this.backgroundAudioManager = wx.getBackgroundAudioManager()
  //监视播放暂停
  this.backgroundAudioManager.onPlay(()=> {
    //修改音乐播放状态
    this.changePlayState(true);
    appInstance.globalData.musicId=musicId;
    /* 
    this.setData({
      isPlay:true
    })
    */
  }),
  this.backgroundAudioManager.onPause(()=> {
    this.changePlayState(false);
  }),
  this.backgroundAudioManager.onStop(()=> {
    this.changePlayState(false);
    
  })
 
  //监听音乐播放结束
  this.backgroundAudioManager.onEnded(()=> {
    //自动切换至下一首音乐，并自动播放
    PubSub.publish('switchType','next')
    //将实时进度条的长度还原成0,时间也置为00:00
    this.setData({
      currentWidth:0,
      currentTime:'00:00'
    })
  })
  //监听音乐实时播放进度 .onTimeUpdate 回调函数实时监听进度
  this.backgroundAudioManager.onTimeUpdate(()=> {
    /*backgroundAudioManager.currentTime单位是毫秒  */
      let currentTime = moment(this.backgroundAudioManager.currentTime*1000).format('mm:ss');
      /* currtime/duratime == currWidth/duraWidth */
      let currentWidth= this.backgroundAudioManager.currentTime/this.backgroundAudioManager.duration*450;
      this.setData({
        currentTime,
        currentWidth
      })
  })
},
  //封装一个函数：isPlay功能函数
  changePlayState(isPlay){
    //修改音乐播放状态
    this.setData({
      isPlay/* 同名，相当于isPlay:传入的值 */
    })
    //修改全局音乐播放状态
    appInstance.globalData.isMusicPlay=isPlay;
  },
  //点击播放、暂停的回调函数
  handleMusicPlay(){
    let isPlay = !this.data.isPlay;
    this.setData({
      isPlay/* 同名 */
    })
    let {musicId,musicLink} = this.data;/* 解构赋值 */
    this.musicControl(isPlay,musicId,musicLink);/* 点击调用 */
  },

  /* 控制音乐播放暂停的功能函数 */
  async musicControl(isPlay,musicId,musicLink){
    
    if(isPlay){/* 音乐播放 */
      if(!musicLink){
        //获取音乐播放链接
      let musicLinkData = await request('/song/url',{id:musicId})
      musicLink = musicLinkData.data[0].url;
      this.setData({
        musicLink
      })
      }
      /* 创建控制音乐播放的实例 */
      this.backgroundAudioManager.src=musicLink;
      this.backgroundAudioManager.title=this.data.song.name;/* 必须要title */
    }else {//暂停
      this.backgroundAudioManager.pause();
    }
  },
  //获取音乐详情的功能函数
  async getMusicInfo(musicId){
    let songData = await request ('/song/detail',{ids:musicId});
    
    let durationTime = moment(songData.songs[0].dt).format('mm:ss');
    this.setData({
      song: songData.songs[0],
      durationTime
    })
    //动态修改窗口标题
    wx.setNavigationBarTitle({
      title: this.data.song.name,
    })
  },
  //点击切歌的回调
  handleSwitch(event){
    //获取切歌的类型
    let type= event.currentTarget.id;
    //关闭当前播放的音乐
    this.backgroundAudioManager.stop();
    //订阅来自recommendSong页面发布得到musicId的消息
    PubSub.subscribe('musicId',(msg,musicId) => {
      console.log(musicId);
      //获取音乐详情信息
      this.getMusicInfo(musicId);
      //自动播放当前音乐
      this.musicControl(true,musicId)
      //取消订阅
      PubSub.unsubscribe('musicId');
    })
    //发布消息数据给recommendSong页面
    PubSub.publish('switchType',type)
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})