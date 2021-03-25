// pages/video/video.js
import request from '../../utils/request'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    videoGroupList:[],//导航标签数据
    navId:'',//导航的标识位，设置点击出现下划线 
    videoList:[],//视频列表数据
    videoId:'',//视频id标识
    videoUpdateTime:[], //记录video播放时长
    isTriggered:false,//标识下拉刷新是否被触发
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //获取导航数据
    this.getVideoGroupListData();
   /*  //获取视频列表数据
    this.getVideoList(this.data.navId) */
  },
  //获取导航数据
  async getVideoGroupListData(){
    let videoGroupListData=await request('/video/group/list');
    this.setData({
      videoGroupList: videoGroupListData.data.slice(0,14),
      navId:videoGroupListData.data[0].id
    })
        //获取视频列表数据
        this.getVideoList(this.data.navId)
  },
  //获取视频列表数据
  async getVideoList(navId){
    let videoListData=await request('/video/group',{id:navId})
    //关闭消息提示框
    wx.hideLoading();
    let index=0;
    let videoList=videoListData.datas.map(item=> {
      item.id=index++;
      return item;
    })
    
    this.setData({
      videoList,
      isTriggered:false //关闭下拉刷新
    })
  },
  //点击切换导航的回调
  changeNav(event){
    let navId= event.currentTarget.id;/* 返回其监听器触发事件的节点，即当前处理该事件的元素、文档或窗口。通过id向event传参时如果传的是number会自动转为string */
    
    this.setData({
      navId: navId*1,/* 默认为字符串形式，转成number与item.id中一致 */
      videoList:[]//切换时将原先视频列表关闭

    })
    //显示正在加载
    wx.showLoading({
      title: '正在加载',
    })
  //动态获取当前导航对应的视频数据
  this.getVideoList(this.data.navId)
  },
  // 点击播放/继续播放的回调
  handlePlay(event){
    /*
    需求：
    在点击播放的事件中需要找到上一个播放的视频
    在播放的新的视频之前关闭上一个正在播放的视频
    关键：找到上一个视频的实例对象，如何确认点击播放的视频和正在播放的视频不是同一个视频
    单例模式：
    1.需要创建多个对象的场景下，通过一个变量接收，始终保持只有一个对象，
    2.节省内存空间
     */
    let vid =event.currentTarget.id;
    //关闭上一个播放的视频
    // this.vid !=vid&&this.videoContext&&this.videoContext.stop();
    /* 等于：
    if(this.vid!==vid){
      if(this.videoContext){
        this.videoContext.stop()
      }
    }
     */
    // this.vid=vid;
    //更新data中videoId的状态数据
    this.setData({
      videoId:vid
    })
    // 创建控制video标签的实例对象
    this.videoContext =wx.createVideoContext(vid)
    //判断当前的视频之前是否播放过，是否有播放记录 如果有，跳转至指定播放位置
    let {videoUpdateTime}=this.data;
    let videoItem=videoUpdateTime.find(item =>item.vid ===vid);
    if(videoItem){
      this.videoContext.seek(videoItem.currentTime)
    }
    this.videoContext.play();
  },
  //监听视频播放进度的回调
  handleTimeUpdate(event){
    let videoTimeObj = {vid:event.currentTarget.id,currentTime:event.detail.currentTime}
    let {videoUpdateTime}=this.data;
    /* 
    思路：判断记录时长的videoUpdateTime数组中是否有当前视频的播放记录
    1.如果有，在原有的播放记录中修改播放时间为当前的播放时间
    2.没有，需要在数组中添加当前视频的播放对象。
     */
    let videoItem = videoUpdateTime.find(item => item.vid=== videoTimeObj.vid);
    if(videoItem){//之前有
      videoItem.currentTime=event.detail.currentTime;
    }else{//之前没有
      videoUpdateTime.push(videoTimeObj)
    }
    this.setData({
      videoUpdateTime
    })
  },
  //视频播放结束后的回调 
  handleEnded(event){
    //移除记录播放时长数组当前视频的对象
    let {videoUpdateTime}=this.data;
    videoUpdateTime.splice(videoUpdateTime.findIndex(item=>item.vid===event.currentTarget.id),1)
    this.setData({
      videoUpdateTime
    })
  },
  //自定义下拉刷新
  handleRefresher(){
    console.log('下拉刷新');
    //再次发请求，获取最新视频列表数据
    this.getVideoList(this.data.navId)
  },
  //上拉触底刷新
  handleToLower(){
    console.log('上拉触底');
    //数据分页 
    //网易云音乐暂时没有提供分页的api
    /* 
    let newVideoLst=[];
    let videoList=this.data.videoList;
    videoList.push(...newVideoList);//三点运算符拆包,数组中拆成一个个单独对象
    this.setData({
      videoList
    })
     */
  },
  //跳转至搜索页面
  toSearch(){
    wx.navigateTo({
      url: '/pages/search/search',
    })
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
    console.log('页面的下拉刷新');
    /* 要去video.json 中设置"enablePullDownRefresh":true */
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    console.log('页面的上拉触底');
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    /* 右上角的三个点的分享功能   */
  }
})