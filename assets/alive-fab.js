(function(){
  function emit(root,name,detail){
    root.dispatchEvent(new CustomEvent(name,{bubbles:true,detail:detail||{}}));
  }

  function safeFocus(element){
    if(!element)return;
    try{element.focus({preventScroll:true});}
    catch{try{element.focus();}catch{}}
  }

  function makeItem(label,href,disabled){
    const a=document.createElement('a');
    a.className='alive-fab__item';
    a.textContent=label;
    a.setAttribute('role','menuitem');
    a.setAttribute('tabindex','-1');
    if(disabled){
      a.setAttribute('aria-disabled','true');
      a.href='#';
    }else{
      a.href=href;
    }
    return a;
  }

  function initAliveFab(options){
    options=options||{};
    const mount=options.container||document.body;
    const productsHref=options.productsHref||'/products';
    const programsHref=options.programsHref||'/programs';
    let partnershipsHref=options.partnershipsHref||'';

    const root=document.createElement('div');
    root.className='alive-fab';
    root.setAttribute('data-alive-fab','');

    const fan=document.createElement('div');
    fan.className='alive-fab__fan';
    fan.id='alive-fab-menu';
    fan.setAttribute('role','menu');
    fan.setAttribute('aria-label','Products, Programs and Partnerships');
    fan.setAttribute('aria-hidden','true');

    const products=makeItem('Products',productsHref,false);
    const programs=makeItem('Programs',programsHref,false);
    const partnerships=makeItem('Partnerships',partnershipsHref,!partnershipsHref);
    fan.append(products,programs,partnerships);

    const main=document.createElement('button');
    main.type='button';
    main.className='alive-fab__main';
    main.setAttribute('aria-label','Open Products, Programs and Partnerships');
    main.setAttribute('aria-expanded','false');
    main.setAttribute('aria-haspopup','menu');
    main.setAttribute('aria-controls',fan.id);

    root.append(fan,main);
    mount.appendChild(root);

    let open=false;
    let nudgeTimer=null;
    const enabledItems=()=>[products,programs,partnerships].filter(item=>item.getAttribute('aria-disabled')!=='true');

    function focusItem(index){
      const items=enabledItems();
      if(!items.length)return;
      const normalized=(index+items.length)%items.length;
      items.forEach((item,i)=>item.setAttribute('tabindex',i===normalized?'0':'-1'));
      safeFocus(items[normalized]);
    }

    function setOpen(next,reason,focusIndex){
      const wasOpen=open;
      open=Boolean(next);
      root.classList.toggle('is-open',open);
      main.setAttribute('aria-expanded',String(open));
      main.setAttribute('aria-label',open?'Close Products, Programs and Partnerships':'Open Products, Programs and Partnerships');
      fan.setAttribute('aria-hidden',open?'false':'true');
      if(open){
        const items=enabledItems();
        items.forEach((item,i)=>item.setAttribute('tabindex',i===0?'0':'-1'));
        partnerships.setAttribute('tabindex',partnershipsHref?(partnerships.getAttribute('tabindex')||'-1'):'-1');
        if(!wasOpen)emit(root,'alivefab:open',{reason:reason||'api'});
        if(Number.isInteger(focusIndex))requestAnimationFrame(()=>focusItem(focusIndex));
      }else{
        [products,programs,partnerships].forEach(item=>item.setAttribute('tabindex','-1'));
        if(wasOpen)emit(root,'alivefab:close',{reason:reason||'api'});
      }
    }

    function nudge(){
      clearTimeout(nudgeTimer);
      root.classList.remove('is-nudging');
      void root.offsetWidth;
      root.classList.add('is-nudging');
      nudgeTimer=setTimeout(function(){root.classList.remove('is-nudging');},1600);
      emit(root,'alivefab:nudge',{source:'patroller-ready-hook'});
    }

    main.addEventListener('click',function(){setOpen(!open,'main-button');});
    main.addEventListener('keydown',function(event){
      if(event.key==='ArrowUp'||event.key==='ArrowDown'){
        event.preventDefault();
        const items=enabledItems();
        setOpen(true,'keyboard',event.key==='ArrowUp'?items.length-1:0);
      }
    });

    [products,programs].forEach(function(item){
      item.addEventListener('click',function(){
        emit(root,'alivefab:navigate',{label:item.textContent,href:item.getAttribute('href')});
        setOpen(false,'navigate');
      });
    });

    partnerships.addEventListener('click',function(event){
      if(!partnershipsHref){
        event.preventDefault();
        emit(root,'alivefab:partnerships-unavailable',{});
        return;
      }
      emit(root,'alivefab:navigate',{label:'Partnerships',href:partnershipsHref});
      setOpen(false,'navigate');
    });

    fan.addEventListener('keydown',function(event){
      const items=enabledItems();
      const current=items.indexOf(document.activeElement);
      if(current<0)return;
      if(event.key==='ArrowDown'||event.key==='ArrowRight'){
        event.preventDefault();focusItem(current+1);
      }else if(event.key==='ArrowUp'||event.key==='ArrowLeft'){
        event.preventDefault();focusItem(current-1);
      }else if(event.key==='Home'){
        event.preventDefault();focusItem(0);
      }else if(event.key==='End'){
        event.preventDefault();focusItem(items.length-1);
      }else if(event.key==='Escape'){
        event.preventDefault();setOpen(false,'escape');safeFocus(main);
      }
    });

    document.addEventListener('pointerdown',function(event){
      if(open&&!root.contains(event.target))setOpen(false,'outside');
    });

    document.addEventListener('focusin',function(event){
      if(open&&!root.contains(event.target))setOpen(false,'focus-left');
    });

    document.addEventListener('keydown',function(event){
      if(event.key==='Escape'&&open){
        event.preventDefault();
        setOpen(false,'escape');
        safeFocus(main);
      }
    });

    setOpen(false,'init');

    const api={
      root:root,
      mainButton:main,
      open:function(){setOpen(true,'api');},
      close:function(){setOpen(false,'api');},
      toggle:function(){setOpen(!open,'api');},
      nudge:nudge,
      isOpen:function(){return open;},
      setPartnershipsHref:function(href){
        partnershipsHref=href||'';
        if(partnershipsHref){
          partnerships.href=partnershipsHref;
          partnerships.removeAttribute('aria-disabled');
          partnerships.setAttribute('tabindex','-1');
          if(open){const items=enabledItems();items.forEach((item,i)=>item.setAttribute('tabindex',i===0?'0':'-1'));}
        }else{
          partnerships.href='#';
          partnerships.setAttribute('aria-disabled','true');
          partnerships.setAttribute('tabindex','-1');
        }
      }
    };

    window.AliveFab=api;
    emit(root,'alivefab:ready',{api:api});
    return api;
  }

  window.initAliveFab=initAliveFab;
})();
