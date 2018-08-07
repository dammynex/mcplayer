var MCPlayer = (function () {
    
    'use strict'
    
    var MCPlayer = {
        
        addTracks: function(tr) {
            
            this.trackList = this.trackList.concat(tr)
            this.updateTracks()
            this.playerEl.dispatchEvent(this.Event.Add)
            
            return this.trackList.length - 1;
        },
        
        currentTime: function () {
            
            return this.playerEl.currentTime
        },
        
        el: function (elm) {
            
            var audio = document.createElement('audio'),
                _this = this,
                pctPlayed,
                //Buttons
                playBtn,
                pauseBtn,
                playPauseBtn,
                nextBtn,
                prevBtn,
                stopBtn,
                muteBtn,
                volumeAddBtn,
                volumeReduceBtn,
                seekTracker,
                thumb
            
            audio.setAttribute('height', '0')
            audio.setAttribute('width', '0')
            
            /* Assign Elements */
            this.defaultThumb = ''
            this.events = {}
            this.repeat = false
            this.currentTrack = -1
            this.el = document.querySelector(elm)
            this.playerEl = audio
            this.titleEl = this.el.querySelector('[role="title"]') || null
            this.durationEl = this.el.querySelector('[role="duration"]')
            this.currentDurationEl = this.el.querySelector('[role="currentDuration"]')
            this.tracklistEl = this.el.querySelector('[role="tracklist"]')
            this.seeker = this.el.querySelector('[role="seeker"]')
            
            /** Event Handlers **/
            thumb = this.el.querySelector('[role="thumb"]')
            playBtn = this.el.querySelector('[role="play"]')
            playPauseBtn = this.el.querySelector('[role="playPause"]')
            pauseBtn = this.el.querySelector('[role="pause"]')
            nextBtn = this.el.querySelector('[role="next"]')
            prevBtn = this.el.querySelector('[role="prev"]')
            stopBtn = this.el.querySelector('[role="stop"]')
            muteBtn = this.el.querySelector('[role="mute"]')
            volumeAddBtn = this.el.querySelector('[role="volumeAdd"]')
            volumeReduceBtn = this.el.querySelector('[role="volumeReduce"]')
            seekTracker = this.el.querySelector('[role="seekTracker"]')
            this.playBtn = playBtn
            
            //Play Event
            this.click(playBtn, function(e) {
                e.preventDefault()
                _this.play()
            })
            
            //Pause Event
            this.click(pauseBtn, function(e) {
                e.preventDefault()
                _this.pause()
            })
            
            //Next Event
            this.click(nextBtn, function (e) {
                e.preventDefault()
                _this.next()
            })
            
            //Prev Event
            this.click(prevBtn, function (e) {
                e.preventDefault()
                _this.prev()
            })
            
            //Stop Event
            this.click(stopBtn, function (e) {
                e.preventDefault()
                _this.stop()
            })
            
            //Mute Event
            this.click(muteBtn, function (e) {
                e.preventDefault()
                _this.mute()
            })
            
            //Add Volume Event
            this.click(volumeAddBtn, function (e) {
                e.preventDefault()
                _this.volumeAdd()
            })
            
            //Reduce Volume Event
            this.click(volumeReduceBtn, function (e) {
                e.preventDefault()
                _this.volumeReduce()
            })
            
            //PlayPause Event
            this.click(playPauseBtn, function (e) {
                e.preventDefault()
                if (_this.playerEl.paused) _this.play()
                else _this.pause()
            })
            
            //Set seeker width
            if(this.seeker) {
                
                this.seeker.style.width = 0
            }
            
            //Role tracker event
            this.click(seekTracker, function(e) {
                
                if(_this.getCurrentTrackType() != 'ad') {

                    var clickedWidth = e.pageX - this.offsetLeft,
                        totalWidth = this.offsetWidth,
                        duration = _this.playerEl.duration,
                        newDuration = (clickedWidth/totalWidth) * duration
                    
                    _this.playerEl.currentTime = newDuration
                }
            })
            
            
            /** Player Events **/
            this.on('ended', function () {

                if(_this.getCurrentTrackType() == 'ad') {
                    
                    _this.removeTrack( _this.getCurrentTrackIndex() )
                }

                if(_this.isLooped()) {
                    
                    _this.playerEl.currentTime = 0
                    _this.play()
                    
                } else {
                    
                    if(_this.stopAfter) _this.stop()
                    _this.next()
                }
            })
            
            this.on('loadeddata', function() {
                
                if(_this.durationEl)
                    _this.durationEl.innerHTML = _this.sec2time(_this.playerEl.duration)
            })
            
            this.on('timeupdate', function() {
                
                _this.currentDurationEl.innerHTML = _this.sec2time(_this.playerEl.currentTime)
                pctPlayed = ((_this.playerEl.currentTime/_this.playerEl.duration) * 100)
                
                if(_this.seeker) {
                    _this.seeker.style.width = pctPlayed + '%'
                }
            })
            
            this.on('play', function () {
                
                _this.titleEl.innerHTML = _this.getCurrentTrackTitle()
                
                if(thumb) {
                    thumb.setAttribute('src', _this.getCurrentTrackThumbnail())
                }
            })
            
            /** Custom events **/
            this.Event = {}
            
            this.Event.Next = new Event('next')
            this.Event.Prev = new Event('prev')
            this.Event.Pause = new Event('pause')
            this.Event.Play = new Event('play')
            this.Event.Loop = new Event('loop')
            this.Event.Mute = new Event('mute')
            this.Event.Remove = new Event('remove')
            this.Event.Add = new Event('add')
            this.Event.VolumeAdd = new Event('volumeAdd')
            this.Event.VolumeReduce = new Event('volumeReduce')
            this.Event.Update = new Event('update')
            this.Event.Stop = new Event('stop')
            this.Event.TrackChanged = new Event('trackChanged')
            
            return this
        },
        
        click: function (el, fn) {
            
            if(el) {
                
                el.addEventListener('click', fn)
                return el
            }
        },

        findAd: function () {
            console.log(this.canPlayAds())
            if(!this.canPlayAds()) {
                return null
            }

            var index,
                _this = this,
                list = _this.trackList,
                returnedIndex,
                thisIndex

            for(var i = 0; i < this.trackList.length; i++) {

                thisIndex = this.trackList[i]
                if(thisIndex.type == 'ad') returnedIndex = i
            }

            return returnedIndex
        },

        getCurrentTrackTime: function () {

            return this.playerEl.currentTime
        },

        getCurrentTrackDuration: function () {

            return this.playerEl.duration
        },
        
        getCurrentTrackIndex: function () {
            
            return this.currentTrack
        },
        
        getCurrentTrackTitle: function () {
            
            var track = this.trackList[this.getCurrentTrackIndex()],
                vtitle
            
            if(track) vtitle = track.title
            else vtitle = ''
            
            return vtitle
        },
        
        getCurrentTrackThumbnail: function () {
            
            var track = this.trackList[this.getCurrentTrackIndex()]
            return (track) ? track.thumb : this.defaultThumb
        },

        getCurrentTrackType: function () {

            var track = this.trackList[pl.getCurrentTrackIndex()]
            return (track) ? (track.type || 'track') : 'track'
        },
        
        getEl: function () {
            
            return this.el
        },

        hasPlayed: false,

        isAd: function (index) {

            return (this.trackList[index].type == 'ad')
        },
        
        isLooped: function () {
            
            return this.playerEl.loop
        },
        
        isPlaying: function () {
            
            return !this.playerEl.paused
        },
        
        loop: function () {
            
            this.playerEl.loop = !this.playerEl.loop
            this.playerEl.dispatchEvent(this.Event.Loop)
        },
        
        mute: function () {
            
            this.playerEl.muted = !this.playerEl.muted
            this.playerEl.dispatchEvent(this.Event.Mute)
            
            return this
        },
        
        next: function () {
            
            var trackNo = this.nextOnList || Number(this.currentTrack) + 1
            if(trackNo > this.trackList.length - 1) trackNo = 0
            
            
            this.playIndex(trackNo)
            this.playerEl.dispatchEvent(this.Event.Next)
            
            return trackNo
        },
        
        on: function (ev, fn) {
            
            this.playerEl.addEventListener(ev, fn)
        },
        
        pause: function () {
            
            this.playerEl.pause()
            this.playerEl.dispatchEvent(this.Event.Pause)
            
            return this
        },
        
        play: function (stopAfter) {

            if(this.playerEl.src == '') this.playIndex(0)
            else this.playerEl.play()
            
            this.hasPlayed = true
            this.stopAfter = stopAfter
            this.playerEl.dispatchEvent(this.Event.Play)
            return this
        },
        
        playIndex: function(index, stopAfter) {
            
            if((index > this.trackList.length - 1) && this.isLooped()) {
                index = 0
            } 
            
            var track = this.trackList[index],
                theindex = index,
                ad,
                next,
                url

            if(!this.hasPlayed) {

                ad = this.findAd()

                if(ad !== null) {

                    theindex = ad
                    track = this.trackList[ad]
                    this.nextOnList = (ad < index) ? index - 1 : index

                }

            } else if(this.nextOnList !== null) {

                this.nextOnList = null
            }

            if(track) {
                url = track.url
                this.playerEl.src = url
                this.play(stopAfter)
            }
            
            this.currentTrack = theindex
            this.playerEl.dispatchEvent(this.Event.TrackChanged)
            return index
        },
        
        prev: function () {
            
            var trackNo = this.currentTrack
            
            if(trackNo <= -1) trackNo = this.trackList.length - 1
            else trackNo = trackNo - 1

            
            this.playIndex(trackNo)

            this.playerEl.dispatchEvent(this.Event.Prev)
            
            return trackNo
        },
        
        removeTrack: function(index) {
            
            this.trackList.splice(index, 1)
            this.updateTracks()
            return this
        },
        
        sec2time: function (s) {
            
            var hour = Number(Math.floor(s / 3600)),
                minute = Number(Math.floor((s % 3600) / 60)),
                sec = Number(Math.floor(s % 60))
            
            if(minute < 10) minute = '0' + minute.toString()
            if(hour < 10) hour = '0' + hour.toString()
            if(sec < 10) sec = '0' + sec.toString()
            
            return hour + ':' + minute + ':' + sec
        },
        
        self: function () {
            
            return this
        },
        
        setDefaultThumb: function (src) {
            
            this.defaultThumb = src
        },
        
        stop: function() {
            
            this.pause()
            this.playerEl.currentTime = 0
            this.playerEl.dispatchEvent(this.Event.Stop)
        },

        stopAfter: true,

        nextOnList: null,
        
        tracks: function (tr) {
            
            if(!tr) tr = JSON.parse(this.el.getAttribute('data-tracks'))
            if(!tr) tr = []
                
            this.trackList = tr
            this.updateTracks()
            
            return this
        },
        
        updateTracks: function () {
            
            var _this = this,
                trUl = document.createElement('ul'),
                trLi,
                trLiLink,
                num = 1
            
            if(this.trackList && this.tracklistEl) {
                
                this.tracklistEl.innerHTML = ''
                
                
                for(var i = 0; i < this.trackList.length; i++ ) {
                    
                    if(!(_this.trackList[i].type && _this.trackList[i].type == 'ad')) {

                        trLi = document.createElement('li')
                        trLiLink = document.createElement('a')
                        
                        trLiLink.innerHTML = '[' + num + '] ' + _this.trackList[i].title
                        trLiLink.setAttribute('data-trackIndex', i)

                        if(_this.trackList[i].trackId)
                            trLiLink.setAttribute('data-track-id', _this.trackList[i].trackId)
                        
                        trLiLink.setAttribute('href', '#')
                        
                        trLiLink.addEventListener('click', function (e) {
                            
                            e.preventDefault()
                            _this.playIndex(e.target.getAttribute('data-trackIndex'))
                        })
                        
                        trLi.appendChild(trLiLink)
                        trUl.appendChild(trLi)
                        num++
                    }
                }
                
                this.tracklistEl.appendChild(trUl)
            }
            
            this.playerEl.dispatchEvent(this.Event.Update)
            
        },
        
        volume: function (vol) {
            
            if(typeof vol !== 'number') return this.playerEl.volume
            
            this.playerEl.volume = (vol/100)
            return vol
        },
        
        volumeAdd: function () {
            
            if(this.playerEl.volume < 1) {
                
                var newVolume = (this.playerEl.volume * 100) + 10
                this.volume(newVolume)
                return newVolume
            }
            
            this.playerEl.dispatchEvent(this.Event.VolumeAdd)
            return 100
        },
        
        volumeReduce: function () {
            
            if(this.playerEl.volume > 0) {
                
                var newVolume = (this.playerEl.volume * 100) - 10
                this.volume(newVolume)
                return newVolume
            }
            
            this.playerEl.dispatchEvent(this.Event.VolumeReduce)
            return 0
        },

        playAds: true,

        canPlayAds: function () {
            var val = this.el.getAttribute('data-play-ads')
            if(!val) return true
            if(val == 'false') return false
            if(val == 'nil') return false
            return true
        }
        
    }
    
    return MCPlayer
    
}())