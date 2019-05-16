
var main = {
    ctx: null,
    cvs: null,
    cvsOffsetX: 0,
    cvsOffsetY: 0,
    cvsOffsetY: 0,
    mouse: {x:0, y:0},
    currGroup: '',
    currSet: 0,
    currPath: 0,
    currNode: 0,
    prevNode: 0,
    currEditor: 'single',
    colors: [
        "#fc97af", "#87f7cf", "#f7f494", "#72ccff", "#f7c5a0", "#d4a4eb", "#d2f5a6", "#76f2f2",
        '#dd6b66','#759aa0','#e69d87','#8dc1a9','#ea7e53','#eedd78','#73a373','#73b9bc','#7289ab', '#91ca8c','#f49f42'
    ],
    config: {
        zoom: 1,
        width: 16,
        height: 9,
        NodeRad: 10,
        strokeWidth: 5,
        fillColor: '#1E9FFF',
        smooth: 0.6,
    },
    event: {
        choseLine: false,
        choseNode: false,
        dragNode: false,
        play: false
    },
    play: {
        begin: 0,
        prev: [],
        maxDelay: 0
    },
    data: {},
    actions: {},
    newGroup: function(name) {
        name = name || '未命名项目';
        var count = 1;
        var group = name;
        while(this.data.hasOwnProperty(group)) {
            group = name + count;
            count ++;
        }
        this.data[group] = {
            lines: [],
            sets: [],
        }
        return group;
    },
    delGroup: function(grp) {
        delete this.data[grp];
    },
    newSet: function(name) {
        var group = this.getGroup();
        var set = {
            name: name || '未命名路径组',
            // time: 8,
            paths: []
        }
        group.sets.push(set);
        return group.sets.length-1;
    },
    modSet: function(name) {
        this.getSet().name = name;
    },
    delSet: function(idx) {
        return this.getGroup().sets.splice(idx, 1);
    },
    newSetPath(id) {
        var set = this.getSet();
        id = id || 0;
        set.paths.push({
            id: id,
            delay: 0,
            origin: {x:0, y:0},
            translate: {x:0, y:0},
            rotate: 0,
            scale: {x:1,y:1},
            repeat: 0,
            interval: 0,
            monsterID: '',
            duration: 8,
        });
        return set.paths.length-1;
    },
    modSetPath(idx, data) {
        var set = this.getSet();
        set.paths[idx] = data;
    },
    delSetPath(id) {
        var set = this.getSet();
        return set.paths.splice(id, 1);
    },
    newPath: function(name) {
        var group = this.getGroup();
        group.lines.push({
            name: name || '未命名路径',
            total: 1,
            nodes: [
                {
                    curr: new V2(-this.cvs.width/2, 0),
                    ctr1: new V2(0, 0),
                    ctr2: new V2(0, 0),
                    time: 1,
                    act: null
                },{
                    curr: new V2(this.cvs.width/2, 0),
                    ctr1: new V2(this.cvs.width/2, 0),
                    ctr2: new V2(this.cvs.width/2, 0),
                    time: 0,
                    act: null
                }
            ]
        });
        return group.lines.length-1;
    },
    modPath: function(name) {
        this.getPath().name = name;
    },
    delPath: function(idx) {
        var group = this.getGroup();
        for (var i = 0; i < group.sets.length; i++) {
            for (var j=group.sets[i].paths.length-1; j >=0 ; j--) {
                if (group.sets[i].paths[j].id == idx) {
                    // self.delSetPath(j);
                    group.sets[i].paths.splice(j, 1);
                } else if (group.sets[i].paths[j].id > idx) {
                    group.sets[i].paths[j].id -= 1;
                }
            }
        }
        return this.getGroup().lines.splice(idx, 1);
    },
    newNode: function(idx, x, y) {
        var node = {
            curr: new V2(x, y),
            ctr1: new V2(x, y),
            ctr2: new V2(x, y),
            time: 1,
            act: null
        };
        var path = this.getPath();
        path.total += 1;
        path.nodes.splice(++idx, 0, node);
        // add node option
        this.initNodeOpt();
        // $('#node').append('<option value="'+(nodes.length-1)+'">'+utils.fillZero(this.currPath)+' - '+utils.fillZero(nodes.length-1)+'</option>');
        return idx;
    },
    modNode: function(idx, data) {
        var node = this.getNode();
        if (data.time) {
            node.time = data.time;
        }
        if (data.act) {
            node.act = data.act;
        }
        if (data.x) {
            node.curr.x = data.x;
        }
        if (data.y) {
            node.curr.y = data.y;
        }
    },
    delNode: function(idx) {
        var path = this.getPath();
        path.total -= path.nodes[idx].time;
        return path.nodes.splice(idx, 1);
    },
    getGroup: function(grp) {
        grp = grp || this.currGroup;
        if (!this.data.hasOwnProperty(grp)) {
            console.log(grp);
            this.newGroup(grp);
            this.currGroup = grp;
        }
        return this.data[this.currGroup];
    },
    getSet: function(idx) {
        idx = idx || this.currSet;
        if (idx == -1) {
            return null;
        }
        if (this.getGroup().sets.length == 0) {
            this.newSet();
        }
        return this.getGroup().sets[idx];
    },
    getPath: function(idx) {
        idx = (typeof idx=='undefined') ? this.currPath : idx;
        if (idx == -1) {
            return null;
        }
        if (this.getGroup().lines.length == 0) {
            this.newPath();
        }
        // console.log(this.getGroup());
        return this.getGroup().lines[idx];
    },
    getNode: function(idx) {
        idx = idx || this.currNode;
        if (idx === -1 || idx === undefined) {
            return null;
        }
        // if (this.getPath().nodes.length == 0) {
        //     this.newSet();
        // }
        return this.getPath().nodes[idx];
    },
    isNodeChosen (pos, radius) {
        return Math.pow(this.mouse.x-pos.x, 2) + Math.pow(this.mouse.y-pos.y, 2) <= Math.pow(radius*this.cvs.width/960, 2);
    },
    isLineChosen (curr, ctr1, ctr2, next) {
        return utils.isBezierPoint(curr, ctr1, ctr2, next, this.mouse, 0.005, this.config.strokeWidth*this.cvs.width/960);
    },
    reNewNodeCtrlPoint: function(idx, nodes) {
        nodes = nodes || this.getPath().nodes;
        var i = idx - 2, j=i+4;
        if (idx == -1) {
            i = 0; j = nodes.length-1;
        }
        for (i; i<j; i++) {
            if (i >= 0 && i < nodes.length-1) {
                var from = nodes[i];
                var to = nodes[i+1];
                var prev = i==0 ? nodes[0] : nodes[i-1];
                var next = i==nodes.length-2 ? nodes[i+1] : nodes[i+2];
                var ctrl = utils.getBezierControlPoint(from.curr, to.curr, prev.curr, next.curr, this.config.smooth);
                nodes[i].ctr1.x = ctrl[0].x;
                nodes[i].ctr1.y = ctrl[0].y;
                nodes[i].ctr2.x = ctrl[1].x;
                nodes[i].ctr2.y = ctrl[1].y;
            }
        }
    },
    reNewAllNodes: function() {
        for (var grp in this.data) {
            var lines = this.data[grp].lines;
            for (var i in lines) {
                this.reNewNodeCtrlPoint(-1, lines[i].nodes);
            }
        }
    },
    renderNode: function(nodes, conf) {
        var ret = [], keys = ['curr', 'ctr1', 'ctr2'];
        for (var i=0; i<nodes.length; i++) {
            var tmp = utils.clone(nodes[i]);
            
            for (var key of keys) {
                if (!(tmp[key] instanceof V2)){
                    tmp[key] = new V2(tmp[key].x, tmp[key].y);
                }
                tmp[key] = tmp[key].sub(conf.origin).add(conf.translate).rotate(conf.rotate).mul(conf.scale).add(conf.origin);
            }
            ret.push(tmp);
        }
        return ret;
    },
    drawSingle: function() {
        var total = 10;
        this.ctx.clearRect(-this.cvs.width/2, -this.cvs.height/2, this.cvs.width, this.cvs.height);
        var path = this.getPath();
        var t = this.event.play ? ((new Date().getTime()-this.play.begin)/1000)%total : -1;
        t = t * path.total/total;
        this.drawPath(path.nodes, [t], 0);
    },
    drawSet: function() {
        this.ctx.clearRect(-this.cvs.width/2, -this.cvs.height/2, this.cvs.width, this.cvs.height);
        var set = this.getSet();
        console.log(this.play.maxDelay);
        for (var i=0; i<set.paths.length; i++) {
            var t = [];
            var curr = set.paths[i];
            var path = this.getPath(curr.id);
            if (this.event.play) {
                currTotal = curr.delay + curr.duration + curr.repeat*curr.interval;
                if (currTotal > this.play.maxDelay) {
                    this.play.maxDelay = currTotal;
                }
                t0 = ((new Date().getTime()-this.play.begin)/1000)%this.play.maxDelay - curr.delay;
                var count = curr.repeat;
                while (count >= 0) {
                    t.push(t0 * path.total / curr.duration);
                    t0 -= curr.interval;
                    count --;
                }
            }
            var nodes = this.renderNode(path.nodes, set.paths[i]);
            this.drawPath(nodes, t, i);
        }
    },
    drawPath: function(nodes, time, idx) {
        this.ctx.fillStyle = this.config.fillColor;
        this.ctx.lineWidth = this.config.strokeWidth;
        this.ctx.beginPath();
        for (var i=0; i<nodes.length; i++) {
            if (nodes[i].curr instanceof V2) {
            } else {
                nodes[i].curr = new V2(nodes[i].curr.x, nodes[i].curr.y);
                nodes[i].ctr1 = new V2(nodes[i].ctr1.x, nodes[i].ctr1.y);
                nodes[i].ctr2 = new V2(nodes[i].ctr2.x, nodes[i].ctr2.y);
            }
            var radio = i == this.currNode ? this.config.NodeRad*1.3 : this.config.NodeRad;
            this.ctx.moveTo(nodes[i].curr.x, nodes[i].curr.y);
            this.ctx.arc(nodes[i].curr.x, nodes[i].curr.y, radio, 0, Math.PI*2);
            this.ctx.fill();
        }
        this.ctx.closePath();
        idx = idx || 0;
        if (!this.play.prev[idx]) {
            this.play.prev[idx] = [];
        }
        var color = this.colors[idx%this.colors.length];
        this.ctx.strokeStyle = color;
        for (var i=0; i<nodes.length-1; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(nodes[i].curr.x, nodes[i].curr.y);
            var curr = nodes[i].curr,
            next = nodes[i+1].curr,
            ctr1 = nodes[i].ctr1,
            ctr2 = nodes[i].ctr2;
            this.ctx.bezierCurveTo(ctr1.x, ctr1.y, ctr2.x, ctr2.y, next.x, next.y);
            this.ctx.stroke();
            this.ctx.closePath();
            // play
            if (this.event.play) {
                for (let t in time) {
                    if (time[t] >= 0) {
                        if (time[t] <= nodes[i].time) {
                            var p = utils.getBezierPoint(curr, ctr1, ctr2, next, time[t]/nodes[i].time);
                            this.ctx.moveTo(nodes[i].curr.x, nodes[i].curr.y);
                            this.drawFish(p, this.play.prev[idx][t], color);
                            this.play.prev[idx][t] = p;
                        }
                        time[t] -= nodes[i].time;
                    }
                }
            }
        }
    },
    drawFish: function(curr, prev, color) {
        var ang = 0;
        if (typeof prev!=='undefined') {
            var v2 = {
                x: curr.x - prev.x,
                y: curr.y - prev.y,
            }
            ang = Math.acos(v2.x/Math.sqrt(v2.x*v2.x + v2.y*v2.y));
            if (v2.y < 0 || (v2.y == 0 && v2.x < 0)) {
                ang = 2*Math.PI - ang;
            }
        }
        var r = 25;
        var points = [
            new V2(0, 0),
            new V2((-2)/Math.sqrt(3), 0.5),
            new V2((-2)/Math.sqrt(3), -0.5),
            new V2(0, 0),
            new V2(2/Math.sqrt(3), 0),
            new V2((-1)/Math.sqrt(3), 1),
            new V2((-1)/Math.sqrt(3), -1),
            new V2(2/Math.sqrt(3), 0),
        ];

        this.ctx.beginPath();
        this.ctx.fillStyle = color;
        for (var i in points) {
            var p = points[i].rotate(ang*180/Math.PI).mul(r).add(new V2(curr.x, curr.y));
            if (i==0) {
                this.ctx.moveTo(p.x, p.y);
            } else {
                this.ctx.lineTo(p.x, p.y);
            }
        }
        this.ctx.fill();
        this.ctx.closePath();
        this.ctx.fillStyle = this.config.fillColor;
    },
    
    update: function() {
        if (this.currEditor == 'set') {
            this.drawSet();
        } else {
            this.drawSingle();
        }
        this.laterUpdate();
    },
    laterUpdate: function() {
       
    },
    save: function() {
        storage.set('path-editor-data', this.data);
        // console.log('curr editor', this.currEditor);
        // console.log('curr group', this.currGroup);
        // console.log('curr path', this.currPath);
        // console.log('curr set', this.currSet);
        // console.log('curr node', this.currNode);
        // console.log('curr data', this.data);
        // console.log('curr event', this.event);
    },
    onCanvasMouse(e){
        this.mouse.x = (e.pageX - this.cvsOffsetX)*this.cvs.width/960 - this.cvs.width/2;
        this.mouse.y = this.cvs.height/2 - (e.pageY - this.cvsOffsetY)*this.cvs.height/540;
    },
    onCanvasMove(e){
        if (this.event.play || this.currEditor == 'set') {
            return;
        }
        if (this.event.dragNode) {
            this.getNode().curr.x = this.mouse.x;
            this.getNode().curr.y = this.mouse.y;
            this.reNewNodeCtrlPoint(this.currNode);
        } else {
            this.event.choseLine = false;
            this.event.choseNode = false;
            var nodes = this.getPath().nodes;
            for (var i in nodes) {
                if(this.isNodeChosen(nodes[i].curr, this.config.NodeRad)) {
                    this.currNode = i;
                    this.event.choseNode = true;
                    break;
                }
            }
            if (!this.event.choseNode) {
                for (var i=0; i<nodes.length-1; i++) {
                    if(this.isLineChosen(nodes[i].curr, nodes[i].ctr1, nodes[i].ctr2, nodes[i+1].curr)) {
                        this.prevNode = i;
                        this.event.choseLine = true;
                        break;
                    }
                }
            }
        }
        if (this.event.choseNode) {
            this.initNodeForm();
            $('#canvas').removeClass('onLine').addClass('onNode');
        } else if (this.event.choseLine) {
            $('#canvas').removeClass('onNode').addClass('onLine');
        } else {
            $('#canvas').removeClass('onNode').removeClass('onLine');
        }
    },
    onCanvasDown(e){
        if (this.event.choseNode) {
            this.event.dragNode = true;
        } else if (this.event.choseLine) {
            this.currNode = this.newNode(this.prevNode, this.mouse.x, this.mouse.y);
            this.reNewNodeCtrlPoint(this.currNode);
            this.event.choseLine = false;
            this.event.choseNode = true;
            this.event.dragNode = true;
        }
    },
    onCanvasUp(e){
        if (this.event.dragNode) {
            this.event.dragNode = false;
        }
    },
    onCanvasLeave(e){
        this.event.dragNode = false;
        this.event.choseLine = false;
        this.event.choseNode = false;
    },
    onTabShow(e) {
        if($(e.target).attr('href') == '#single') {
            this.currEditor = 'single';
            this.currPath = 0;
            this.initPathOpt();
            this.initPathForm();
            this.drawSingle();
        } else {
            this.currEditor = 'set';
            this.currSet = 0;
            this.initSetOpt();
            this.initSetForm();
            this.drawSet();
        }
    },
    initPathForm: function() {
        var path = this.getPath();
        $('#path-name').val(path.name);
        this.currNode = 0;
        this.initNodeOpt();
        this.initNodeForm();
    },
    initNodeForm: function() {
        var node = this.getNode();
        if (this.currNode == 0) {
            $('#del-node').addClass('disabled');
            $('#time').removeAttr('disabled');
        } else if (this.currNode == this.getPath().nodes.length-1) {
            $('#del-node').addClass('disabled');
            $('#time').attr('disabled', 'disabled');
        } else {
            $('#time').removeAttr('disabled');
            $('#del-node').removeClass('disabled');
        }
        $('#node').val(this.currNode);
        $('#x').val(node.curr.x*this.config.width/this.cvs.width);
        $('#y').val(node.curr.y*this.config.height/this.cvs.height);
        $('#time').val(node.time);
        $('#act').val(node.act);
    },
    initSetForm: function() {
        var set = this.getSet();
        $('#set-name').val(set.name);
        // init set path
        $('#set .set-path').remove();
        for (var i=0; i<set.paths.length; i++) {
            this.newSetPathForm(set.paths[i].id);
        }
        // this.initNodeOpt();
        this.play.maxDelay = 0;
    },
    newSetPathForm: function(idx) {
        idx = idx || 0;
        var path_opt = '';
        var lines = this.getGroup().lines;
        for (var i=0; i<lines.length; i++) {
            path_opt += '<option value="'+i+'" '+ (idx==i?'selected':'') +'>'+ lines[i].name +'</option>';
        }
        var _html = '<div class="form-group set-path">' + 
            '<div class="col-xs-12">' + 
                '<div class="input-group">' + 
                    '<span class="input-group-addon"> </span>' + 
                    '<select class="form-control path-select">' + 
                    path_opt +
                    '</select>' + 
                    '<span class="input-group-btn">' + 
                        '<button class="btn btn-primary mod-path">设置</button>' + 
                        '<button class="btn btn-danger del-path">删除</button>' + 
                    '</span>' + 
                '</div>' + 
            '</div>' + 
        '</div>';
        
        $('#add-path').before(_html);
    },
    initSetOpt: function(idx) {
        idx = idx || this.currPath;
        var sets = this.getGroup().sets;
        $('#set-select').html('');
        for (var i=0; i<sets.length; i++) {
            $('#set-select').append('<li><a href="#" data-id="'+i+'" class="set-opt">'+sets[i].name+'</a></li>');
        }
    },
    initConfig: function() {
        // 
        var config = storage.get('path-editor-config', true);
        if (config) {
            this.config = config;
        }
    },
    initData: function() {
        // 
        var data = storage.get('path-editor-data', true);
        if (data) {
            this.data = data;
            for (var i in this.data) {
                this.currGroup = i; 
            }
        } else {
            this.currGroup = this.newGroup('默认项目');
            this.currSet = this.newSet();
            this.currPath = this.newPath();
        }
        // action 
        var actions = storage.get('path-editor-action', true);
        if (actions) {
            this.actions = actions;
        }
    },
    initStyle: function() {
        var _style = '';
        for (var i in this.colors) {
            _style += '.set-path:nth-child('+(parseInt(i)+2)+') .input-group-addon{background-color: '+this.colors[i]+';}\n';
        }
        $('head').append('<style type="text/css">' + _style + '</style>');
    },
    initCtx: function() {
        this.cvs = document.getElementById('canvas');
        var offset = $(this.cvs).offset();
        this.cvsOffsetX = offset.left;
        this.cvsOffsetY = offset.top;
        this.ctx = this.cvs.getContext('2d');
        this.ctx.translate(this.cvs.width/2, this.cvs.height/2);
        this.ctx.transform(1, 0, 0, -1, 0, 0);
    },
    initView: function() {
        // group option
        $('#curr-group').html(this.currGroup);
        for (var i in this.data) {
            var cls = i == this.currGroup ? 'group-opt bg-success' : 'group-opt';
            $('#group-select .divider').before('<li data-id="'+i+'"><a class="'+cls+'" href="#">'+i+'</a></li>');
        }
        // setting form
        $('#config-width').val(this.config.width);
        $('#config-height').val(this.config.height);
        $('#config-strokeWidth').val(this.config.strokeWidth);
        $('#config-NodeRad').val(this.config.NodeRad);
        $('#config-fillColor').val(this.config.fillColor);
        $('#config-smooth').val(this.config.smooth);
        // action option
        this.initActionManager();
        this.initActionOpt();
        // nodes option
        this.initNodeOpt();
        // lines option
        this.initPathOpt();
    },
    newActionFormGroup: function(act_id, act_name) {
        var _html = '<div class="form-group action-group" data-id="'+act_id+'">' +
                '<label for="" class="control-label col-sm-3 col-sm-offset-1">'+act_id+'</label>' +
                '<div class="col-sm-6">' +
                    '<div class="input-group">' +
                        '<input type="text" class="form-control act-name" placeholder="动作名" value="'+act_name+'">' +
                        '<span class="input-group-btn">' +
                            '<button class="btn btn-danger act-del">' +
                                '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>' +
                            '</button>' +
                        '</span>' +
                    '</div>' +
                '</div>' +
            '</div>';
        $('#new-act-btn').parents('.form-group').before(_html);
    },
    initActionManager: function() {
        for (var i in this.actions) {
            this.newActionFormGroup(i, this.actions[i]);
        }
    },
    initActionOpt: function() {
        var curr = $('#act').val();
        $('#act').html('');
        for (var i in this.actions) {
            $('#act').append('<option value="'+i+'" '+(curr==i?'selected':'')+'>'+ this.actions[i] +'</option>');
        }
    },
    initNodeOpt: function(idx) {
        idx = idx || this.currNode;
        var nodes = this.getPath().nodes;
        $('#node').html('');
        for (var i=0; i<nodes.length; i++) {
            $('#node').append('<option value="'+i+'"'+(i==idx?' selected':'')+'>'+ utils.fillZero(this.currPath) +' - '+ utils.fillZero(i) +'</option>');
        }
    },
    initPathOpt: function(idx) {
        idx = idx || this.currPath;
        var lines = this.getGroup().lines;
        $('#path-select').html('');
        for (var i=0; i<lines.length; i++) {
            $('#path-select').append('<li><a href="#" data-id="'+i+'" class="path-opt">'+lines[i].name+'</a></li>');
        }
    },
    convertExportLine: function(nodes, conf) {
        var ret = [], keys = ['curr', 'ctr1', 'ctr2'];
        for (var i=0; i<nodes.length; i++) {
            var tmp = utils.clone(nodes[i]);
            
            for (var key of keys) {
                if (!(tmp[key] instanceof V2)){
                    tmp[key] = new V2(tmp[key].x, tmp[key].y);
                }
                if (conf) {
                    tmp[key] = tmp[key].sub(conf.origin).add(conf.translate).rotate(conf.rotate).mul(conf.scale).add(conf.origin);
                }
                tmp[key].x *= this.config.width/this.cvs.width;
                tmp[key].y *= this.config.height/this.cvs.height;
            }
            ret.push(tmp);
        }
        return ret;
    },
    convertExportSet: function(lines) {
        var ret = [], keys = ['translate', 'origin'];
        for (var i=0; i<lines.length; i++) {
            var tmp = utils.clone(lines[i]);
            for (var key of keys) {
                tmp[key].x *= this.config.width/this.cvs.width;
                tmp[key].y *= this.config.height/this.cvs.height;
            }
            tmp.monsterID = [];
            var monsters = lines[i].monsterID.replace(/，/g, ',');
            monsters = monsters.split(',');
            for (var m in monsters) {
                if (monsters[m] === '') {
                    continue;
                }
                if (/^\d+-\d+$/.test(monsters[m])) {
                    var range = monsters[m].split('-');
                    for (var n=range[0];n<=range[1];n++) {
                        tmp.monsterID.push(parseInt(n));
                    }
                } else if (/^\d+$/.test(monsters[m])) {
                    tmp.monsterID.push(parseInt(monsters[m]));
                }
            }
            ret.push(tmp);
        }
        return ret;
    },
    export: function(type) {
        switch (type) {
            case 'lines':       {
                var data = [], lines = this.getGroup().lines;
                for (var i=0; i<lines.length; i++) {
                    data.push(this.convertExportLine(lines[i].nodes));
                }
                utils.exportJson(data, this.currGroup+'-base');break;
            }
            case 'set':         {
                var data = [], lines = this.getGroup().lines, paths = this.getSet().paths;
                for (var i=0; i<paths.length; i++) {
                    data.push(this.convertExportLine(lines[paths[i].id].nodes, paths[i]));
                }
                utils.exportJson(data, this.getSet().name);break;
            }
            case 'group':       
            case 'group-buf':   {
                var data = {
                    linesCount: 0,
                    lines: [],
                    setsCount: 0,
                    sets: []
                }, group = this.getGroup(), sets = group.sets, lines = group.lines;
                for (var i=0; i<lines.length; i++) {
                    var line = {
                        nodes: [],
                        nodesCount: 0,
                        total: 0
                    }
                    line.nodes = this.convertExportLine(lines[i].nodes);
                    line.nodesCount = line.nodes.length;
                    line.total = lines[i].total;
                    data.lines.push(line);
                }
                data.linesCount = data.lines.length;
                for (var i=0; i<sets.length; i++) {
                    var set = {
                        paths: [],
                        pathsCount: 0,
                        time: 0,
                    }
                    set.paths = this.convertExportSet(sets[i].paths);
                    set.pathsCount = set.paths.length;
                    set.time = sets[i].time;
                    data.sets.push(set);
                }
                data.setsCount = data.sets.length;
                if (type == 'group') {
                    utils.exportJson(data, this.currGroup);break;
                } else {
                    utils.exportBinary(data, this.currGroup);
                }
                
                break;
            }
            
            case 'import-data':         {
                $('#ImportModal').modal('show');
                break;
            }
            
            case 'all':         {
                // utils.exportJson(this.data);break;
            }
            case 'all-buf':     {
                // utils.exportBinary(this.data);break;
            }
            default: {
                alert('未完待续..');
            }
        }
    },
    bind: function() {
        var self = this;
        // canvas
        $('#canvas').on('mousemove', this.onCanvasMove.bind(this));
        $('#canvas').on('mousemove', this.onCanvasMouse.bind(this));
        $('#canvas').on('mouseleave', this.onCanvasLeave.bind(this));
        $('#canvas').on('mousedown', this.onCanvasDown.bind(this));
        $('#canvas').on('mouseup', this.onCanvasUp.bind(this));
        // editor tab
        $('#editor').on('show.bs.tab', this.onTabShow.bind(this));
        // group
        $('#group-select').on('click', '.group-opt', function(e) {
            var grp = $(this).parent().data('id');
            $('#curr-group').text(grp);
            $('.group-opt.bg-success').removeClass('bg-success');
            $(this).addClass('bg-success');
            self.currGroup = grp;
            if (self.currEditor == 'set') {
                $('#editor .nav-tabs li a[href="#single"]').trigger('click');
            } else {
                self.currPath = 0;
                self.initPathOpt();
                self.initPathForm();
                self.drawSingle();
            }
            storage.set('path-editor-env', {group: grp});
        // }).on('click', '#new-group', function() {
        //     $(this).data('target'));
        });
        $('#add-group').on('click', function() {
            var grp = $('#group-name').val();
            if ('' === grp) {
                return false;
            }
            grp = self.newGroup(grp);
            $('#group-select .divider').before('<li data-id="'+grp+'"><a class="group-opt" href="#">'+grp+'</a></li>');
            $('#group-select li[data-id="'+grp+'"] .group-opt').trigger('click');
            $('#GroupModal').modal('hide');
        });
        $('#del-group').on('click', function() {
            if (confirm('删除项目"'+self.currGroup+'"后无法恢复，继续删除？')) {
                delete self.data[self.currGroup];
                self.save();
                location.reload(true);
            }
        });
        // setting
        $('#save-setting').on('click', function() {
            $('#SettingModal').modal('hide');
            $('#SettingModal input.form-control').each(function(i, e){
                var attr = $(e).attr('id').substr(7),
                    val = $(e).val();
                if (self.config.hasOwnProperty(attr)) {
                    if (attr == 'smooth') {
                        val = parseFloat(val);
                        if (val >=0 && val<=1 && val != self.config.smooth) {
                            self.config.smooth = val;
                            self.reNewAllNodes();
                        }
                    } else {
                        self.config[attr] = attr=='fillColor' ? val : parseInt(val);
                    }
                }
            });
            // save to storage
            storage.set('path-editor-config', self.config);
            // self.update();
        });
        // path form
        $('#del-node').on('click', function() {
            if (!$(this).hasClass('disabled')) {
                self.delNode(self.currNode);
                self.reNewNodeCtrlPoint(self.currNode);
                self.initNodeOpt();
                self.initNodeForm();
                // self.drawSingle();
            }
        });
        $('#single .form-control').on('change', function() {
            var id = $(this).attr('id');
            if (id == 'path-name') {
                self.modPath($(this).val());
                self.initPathOpt();
            } else if (id == 'node') {
                self.currNode = parseInt($(this).val());
                self.event.choseNode = true;
                self.initNodeForm();
                // self.drawSingle();
            } else if (id == 'x' || id == 'y') {
                if (isNaN($(this).val())){
                    $(this).val(self.getNode().curr[id]*self.config.width/self.cvs.width);return;
                }
                var rate = id == 'x' ? self.cvs.width/self.config.width : self.cvs.height/self.config.height;
                self.getNode().curr[id] = rate * parseFloat($(this).val());
                self.reNewNodeCtrlPoint(self.currNode);
                // self.drawSingle();
            } else if (id == 'time') {
                var node = self.getNode(),
                    oldT = node.time,
                    newT = parseFloat($(this).val());
                if (!isNaN(newT) && newT > 0) {
                    node.time = newT;
                    self.getPath().total += newT - oldT;
                } else {
                    $(this).val(oldT);
                }
            } else if (id == 'act') {
                self.getNode().act = parseInt($(this).val());
            }
        });
        $('#path-select').on('click', '.path-opt', function() {
            self.currPath = parseInt($(this).data('id'));
            self.initPathForm();
            // self.drawSingle();
        });
        $('#path-add').on('click', function() {
            self.currPath = self.newPath();
            self.initPathOpt();
            self.initPathForm();
            // self.drawSingle();
        });
        $('#path-del').on('click', function() {
            if (confirm('删除单路径将影响包含它的路径组，确定删除？')) {
                self.delPath(self.currPath);
                self.currPath = 0;
                self.initPathOpt();
                self.initPathForm();
                // self.drawSingle();
            }
        });
        // set form
        $('#SetModModal').on('show.bs.modal', function(e) {
            var set = self.getSet();
            $('#modal-set-name').val(set.name);
            $('#modal-set-time').val(set.time);
        });
        $('#modal-set-save').on('click', function() {
            var name = $('#modal-set-name').val();
            var time = $('#modal-set-time').val();
            var set = self.getSet();
            if (!isNaN(time)) {
                set.time = parseFloat(time);
            }
            if (name !== '') {
                set.name = name;
                $('#set-name').val(name);
            }
            self.initSetOpt();
            $('#SetModModal').modal('hide');
        });
        $('#set-add').on('click', function() {
            self.currSet = self.newSet();
            self.initSetOpt();
            self.initSetForm();
            // self.drawSet();
        });
        $('#set-del').on('click', function() {
            self.delSet(self.currSet);
            self.currSet = 0;
            self.initSetOpt();
            self.initSetForm();
            // self.drawSet();
        });
        $('#set-select').on('click', '.set-opt', function() {
            self.currSet = parseInt($(this).data('id'));
            self.initSetForm();
            // self.drawSet();
        });
        $('#add-path .btn').on('click', function() {
            self.newSetPath();
            self.newSetPathForm();
            // self.drawSet();
        });
        $('#set form').on('change', '#set-name', function(e) {
            self.modSet($(this).val());
            self.initSetOpt();
        }).on('change', '.path-select', function() {
            var idx = $(this).parents('.form-group').index() - 1;
            self.getSet().paths[idx].id = parseInt($(this).val());
            // self.drawSet();
        }).on('click', '.mod-path', function(){
            // modal
            var idx = $(this).parents('.form-group').index() - 1;
            var setPath = self.getSet().paths[idx];
            $('#save-set-path').data('id', idx); 
            $('#SetPathModal .form-control').each(function(i, e){
                var id = $(e).attr('id');
                var t = id.split('-');
                if (t.length == 2) {
                    var r = t[0] == 'scale' ? 1 : (t[1]=='x'?(self.config.width/self.cvs.width):(self.config.height/self.cvs.height));
                    $(e).val(setPath[t[0]][t[1]] * r);
                } else {
                    $(e).val(setPath[t]);
                }
            });
            $('#SetPathModal').modal('toggle');
        }).on('click', '.del-path', function(){
            var item = $(this).parents('.set-path');
            self.delSetPath(item.index()-1);
            item.remove();
            // self.drawSet();
        });
        $('#save-set-path').on('click', function() {
            var id = $(this).data('id');
            var setPath = self.getSet().paths[id];
            $('#SetPathModal .form-control').each(function(i, e){
                var id = $(e).attr('id');
                if (id === 'monsterID') {
                    setPath[id] = $(e).val();
                } else if (!isNaN($(e).val())) {
                    var t = id.split('-');
                    if (t.length == 2) {
                        if (t[0] !== 'scale') {
                            var r = t[1]=='x'?(self.cvs.width/self.config.width):(self.cvs.height/self.config.height);
                            setPath[t[0]][t[1]] = parseFloat($(e).val()) * r;
                        } else {
                            setPath[t[0]][t[1]] = parseFloat($(e).val());
                        }
                    } else if (id === 'repeat') {
                        if (isNaN($(e).val()) || $(e).val() < 0 ) {
                            alert('重复次数必须为非负整数');return false;
                        }
                        setPath[id] = parseInt($(e).val());
                    } else {
                        setPath[id] = parseFloat($(e).val());
                    }
                }
            });
            $('#SetPathModal').modal('toggle');
            // self.drawSet();
        });
        // action
        $('#new-act-btn').on('click', function() {
            var act_id = $('#new-act-id').val(), act_name = $('#new-act-name').val();
            if (act_id=='' || act_name=='') {
                alert('动作ID和名称不能为空！');return false;
            }
            self.newActionFormGroup(act_id, act_name);
            self.actions[act_id] = act_name;
            $('#new-act-id').val('');
            $('#new-act-name').val('');
            self.initActionOpt();
        });
        $('#action-form').on('click', '.act-del', function() {
            var _item = $(this).parents('.action-group'), act_id = _item.data('id');
            if (self.actions.hasOwnProperty(act_id)) {
                delete self.actions[act_id];
            }
            _item.remove();
            self.initActionOpt();
        }).on('change', 'input.act-name', function() {
            var _item = $(this).parents('.action-group'), act_id = _item.data('id');
            self.actions[act_id] = $(this).val();
            self.initActionOpt();
        });
        $('#save-action').on('click', function() {
            storage.set('path-editor-action', self.actions);
            $('#ManageActionModal').modal('hide');
        });
        // export
        $('#export li a').on('click', function() {
            self.export($(this).data('target'));
        });
        // import
        $('#save-import').on('click', function() {
            var type = $('#import-type').val();
            var file = $('#import-file')[0].files[0];
            var patten = new RegExp( "\\."+type+"$", "gi"); 
            if (patten.test(file.name)) {
                utils.importFromBinary(file, function(data) {
                    alert('未完成待续');
                    console.log(data);
                    return false;
                    
                });
            } else {
                alert('文件格式不正确');
            }
        });
        // run
        $('#run').on('click', function() {
            if (self.event.play) {
                self.event.play = false;
                $(this).html('播放鱼阵');
            } else {
                self.play.begin = new Date().getTime();
                self.play.prev = [];
                self.play.maxDelay = 0;
                self.event.play = true;
                $(this).html('停止播放');
            }
        });
    },
    initEnv: function() {
        var env = storage.get('path-editor-env', true);
        if (this.data.hasOwnProperty(env.group)) {
            this.currGroup = env.group;
        }
    },
    ini: function() {
        this.initConfig();
        this.initStyle();
        this.initCtx();
        this.initData();
        this.initEnv();
        this.initView();
        this.bind();
        var self = this;
        setInterval(function(){
            self.update();
        }, 50/3);
        this.initPathForm();
        setInterval(function() {
            self.save();
        }, 3000);  
    }
};