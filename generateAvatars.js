import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

const teacherPrompts = {
  Emma: `A professional headshot of a 32-year-old female English teacher 
  with shoulder-length blonde hair and blue eyes, genuine warm smile, 
  wearing a light blue professional blazer over white blouse, 
  delicate gold jewelry, soft studio lighting with white background, 
  high quality professional portrait photography, facing directly 
  at camera, confident and approachable expression`,
  
  James: `A professional headshot of a 35-year-old male English teacher 
  with short dark hair, confident friendly smile, wearing navy 
  blazer with white dress shirt and burgundy tie, studio lighting, 
  white background, high quality business portrait photography, 
  professional and authoritative demeanor, facing camera directly`,
  
  Sofia: `A professional headshot of a 28-year-old female English teacher 
  with Mediterranean features, long dark curly hair, warm genuine 
  smile, wearing burgundy cardigan over cream colored top, golden 
  skin tone, studio lighting with soft shadows, white background, 
  approachable and friendly expression, high quality photography`,
  
  Alex: `A professional headshot of a 32-year-old male English teacher 
  with medium-length dark hair, modern styled appearance, friendly 
  smile, wearing charcoal grey cashmere sweater, casual professional 
  style, studio lighting, white background, tech-savvy look with 
  intelligence in eyes, high quality professional photography`
};

async function generateAvatars() {
  console.log('🎨 开始生成教师头像...\n');
  console.log('⚠️  免费账户限流中，使用超长延迟方案\n');
  console.log('📝 总耗时约 2-3 分钟，请耐心等待...\n');
  console.log('=' .repeat(60) + '\n');
  
  const results = {};
  const teacherNames = Object.keys(teacherPrompts);
  
  for (let i = 0; i < teacherNames.length; i++) {
    const name = teacherNames[i];
    const prompt = teacherPrompts[name];
    
    try {
      console.log(`[${i + 1}/${teacherNames.length}] ⏳ 正在生成 ${name} 的头像...`);
      
      const startTime = Date.now();
      
      const output = await replicate.run(
        'stability-ai/sdxl',
        {
          input: {
            prompt: prompt,
            num_outputs: 1,
          }
        }
      );
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      results[name] = output[0];
      console.log(`✅ ${name} 生成成功 (耗时 ${duration} 秒)\n`);
      console.log(`📸 URL: ${output[0]}\n`);
      
      // 如果不是最后一个，等待 60 秒
      if (i < teacherNames.length - 1) {
        console.log('⏱️  等待 60 秒避免限流...\n');
        
        // 每 10 秒显示一次进度
        for (let j = 0; j < 6; j++) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          const remaining = 60 - (j + 1) * 10;
          if (remaining > 0) {
            console.log(`   还需等待 ${remaining} 秒...\n`);
          }
        }
      }
      
    } catch (error) {
      console.error(`❌ ${name} 生成失败: ${error.message}\n`);
      
      // 如果是限流错误，等待更长时间
      if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        console.log('⚠️  遇到限流，等待 90 秒后重试...\n');
        
        for (let j = 0; j < 9; j++) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          const remaining = 90 - (j + 1) * 10;
          if (remaining > 0) {
            console.log(`   还需等待 ${remaining} 秒...\n`);
          }
        }
        
        // 重试一次
        try {
          console.log(`🔄 重试生成 ${name}...\n`);
          const retryOutput = await replicate.run(
            'stability-ai/sdxl',
            {
              input: {
                prompt: prompt,
                num_outputs: 1,
              }
            }
          );
          results[name] = retryOutput[0];
          console.log(`✅ ${name} 重试成功\n`);
          console.log(`📸 URL: ${retryOutput[0]}\n`);
        } catch (retryError) {
          console.error(`❌ ${name} 重试失败: ${retryError.message}\n`);
        }
      }
    }
  }
  
  console.log('=' .repeat(60) + '\n');
  console.log('📋 生成完成！复制下面的配置到程式中：\n');
  console.log(JSON.stringify(results, null, 2));
  console.log('\n✅ 所有成功生成的头像已保存！');
}

generateAvatars().catch(console.error);