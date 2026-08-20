(function(){
  function emit(root,name,detail){
    root.dispatchEvent(new CustomEvent(name,{bubbles:true,detail:detail||{}}));
  }

  function makeItem(label,href,disabled){
    const a=document.createElement('a');
    a.className='alive-fab__item';
    a.textContent=label;
    a.setAttribute('role','menuitem');
    a.setAttribute('tabindex',disabled?'-1':'0');
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
    fan.setAttribute('role','menu');
    fan.setAttribute('aria-label','Products, Programs and Partnerships');

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

    root.append(fan,main);
    mount.appendChild(root);

    let open=false;
    let nudgeTimer=null;

    function setOpen(next,reason){
      open=Boolean(next);
      root.classList.toggle('is-open',open);
      main.setAttribute('aria-expanded',String(open));
      main.setAttribute('aria-label',open?'Close Products, Programs and Partnerships':'Open Products, Programs and Partnerships');
      if(open){
        products.setAttribute('tabindex','0');
        programs.setAttribute('tabindex','0');
        partnerships.setAttribute('tabindex',partnershipsHref?'0':'-1');
        emit(root,'alivefab:open',{reason:reason||'api'});
      }else{
        products.setAttribute('tabindex','-1');
        programs.setAttribute('tabindex','-1');
        partnerships.setAttribute('tabindex','-1');
        emit(root,'alivefab:close',{reason:reason||'api'});
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

    document.addEventListener('pointerdown',function(event){
      if(open&&!root.contains(event.target))setOpen(false,'outside');
    });

    document.addEventListener('keydown',function(event){
      if(event.key==='Escape'&&open){
        setOpen(false,'escape');
        main.focus();
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
          partnerships.setAttribute('tabindex',open?'0':'-1');
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
