"""Smoke test: plays a full automated game of Football Math in headless Chrome.
Usage:  python3 -m http.server 8765   (repo root, separate terminal)
        python3 tests/smoke_test.py [width height tag seconds grade answer_mode]
        grade 0-4 (K-4th), answer_mode auto|tap|type
Requires: pip install playwright && playwright install chromium
(or set CHROMIUM_PATH to an existing Chromium binary)
"""
import asyncio, os, random, sys
from playwright.async_api import async_playwright
async def main(width,height,tag,seconds,grade,mode):
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None, args=['--autoplay-policy=no-user-gesture-required'])
        pg=await b.new_page(viewport={'width':width,'height':height})
        errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto('http://localhost:8765/index.html')
        await pg.screenshot(path=f'/tmp/fm_{tag}_start.png')
        await pg.evaluate(f"saved.qLen=120; saved.pclock=10; me().grade={grade}; me().ansMode='{mode}'; resetLadder()")
        step0=await pg.evaluate("me().stepId")
        await pg.click('#kick')
        shots={'call':0,'snap':0,'led':0,'anim':0}; t=0
        while t<seconds:
            await asyncio.sleep(0.4); t+=0.4
            if await pg.locator('#again').count():
                await pg.screenshot(path=f'/tmp/fm_{tag}_end.png'); print('GAME OVER'); break
            if await pg.locator('.led').count():
                if await pg.locator('#go2').count():
                    if shots['led']<2: await pg.screenshot(path=f'/tmp/fm_{tag}_led_res.png'); shots['led']+=1
                    await pg.click('#go2'); continue
                if shots['led']<1: await pg.screenshot(path=f'/tmp/fm_{tag}_led.png'); shots['led']+=1
                for i in range(3):
                    chips=pg.locator('.chip:not(.used)')
                    await chips.first.click(); await pg.click(f'.slot[data-s="{i}"]')
                await pg.click('#chk'); continue
            if await pg.locator('.plays').count():
                if shots['call']<1: await pg.screenshot(path=f'/tmp/fm_{tag}_call.png'); shots['call']+=1
                best=await pg.evaluate("LOOKS[G.look].best"); await pg.click(f'.play[data-t="{best if random.random()<.8 else random.choice(["easy","medium","hard"])}"]'); continue
            if await pg.locator('.choices').count():
                if shots['snap']<2: await pg.screenshot(path=f'/tmp/fm_{tag}_snap{shots["snap"]}.png'); shots['snap']+=1
                ans=await pg.evaluate('G._ans')
                if random.random()<.08: await pg.locator(f'.choices button:not([data-v="{ans}"])').first.click()
                else: await pg.click(f'.choices button[data-v="{ans}"]')
                await asyncio.sleep(.3)
                if await pg.locator('#ct').count(): await pg.click('#ct')
                continue
            if await pg.locator('.pad').count():
                if shots['snap']<2: await pg.screenshot(path=f'/tmp/fm_{tag}_snap{shots["snap"]}.png'); shots['snap']+=1
                ans=await pg.evaluate('G._ans')
                v=str(ans+1 if random.random()<.08 else ans)
                for ch in v: await pg.click(f'.pad button[data-n="{ch}"]')
                await pg.click('.pad .go'); await asyncio.sleep(.3)
                if await pg.locator('#ct').count(): await pg.click('#ct')
                continue
            if shots['anim']<4 and random.random()<.08:
                await pg.screenshot(path=f'/tmp/fm_{tag}_anim{shots["anim"]}.png'); shots['anim']+=1
        st=await pg.evaluate("({q:G.q,clock:G.clock,home:G.home,away:G.away,total:G.total,right:G.right,step:me().stepId})")
        print(tag,st,'start step:',step0,'errors:',errs[:10])
        await b.close()
a=sys.argv[1:]+['1024','1300','ipad','560','1','auto'][len(sys.argv[1:]):]
asyncio.run(main(int(a[0]),int(a[1]),a[2],float(a[3]),int(a[4]),a[5]))
