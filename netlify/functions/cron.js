import { createClient } from '@supabase/supabase-js';

const handler = async () => {
  const projectsString = process.env.SUPABASE_PROJECTS || '';
  if (!projectsString) {
    console.error('Variável de ambiente SUPABASE_PROJECTS não configurada.');
    return { statusCode: 500, body: 'Variável de ambiente não encontrada.' };
  }

  const projects = projectsString.split(';').map(p => {
    const [name, url, anonKey] = p.split(',');
    return { name, url, anonKey };
  });

  const results = [];

  for (const project of projects) {
    if (!project.url || !project.anonKey) continue;
    
    try {
      const client = createClient(project.url, project.anonKey);
      
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      await client.from('keep_alive').delete().lt('created_at', fiveMinutesAgo);

      await client.from('keep_alive').insert({ 
          created_at: new Date().toISOString(),
          mensagem: "Operação automática 24/7 (via Netlify) executada" 
      });

      results.push({ project: project.name, status: 'success' });
      console.log(`Operação 24/7 bem-sucedida para: ${project.name}`);

    } catch (error) {
      results.push({ project: project.name, status: 'error', message: error.message });
      console.error(`Erro na operação 24/7 para ${project.name}:`, error.message);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Função agendada 24/7 executada.', results }),
  };
};

export { handler };
