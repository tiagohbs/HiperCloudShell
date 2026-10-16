// src/components/ProjectSelectorModal.jsx
import React, { useState } from 'react';
import {
  IconClose,
  IconGitBranch,
  IconCheck,
  IconPlus,
  IconSearch,
  IconTerminal,
  IconZap,
  IconLayers
} from './Icons.jsx';

export default function ProjectSelectorModal({
  isOpen,
  onClose,
  activeProject,
  onSelectProject,
  projectsList = [],
  onAddProject,
  onRemoveProject
}) {
  const [activeTab, setActiveTab] = useState('saved'); // 'saved', 'local_folder', 'clone_github', 'create_new'
  const [searchQuery, setSearchQuery] = useState('');

  // Formulário de Pasta Local
  const [localPath, setLocalPath] = useState('');
  const [localProjectName, setLocalProjectName] = useState('');
  const [localFeedback, setLocalFeedback] = useState(null);

  // Formulário de Clone GitHub
  const [githubUrl, setGithubUrl] = useState('');
  const [cloneTargetPath, setCloneTargetPath] = useState('C:\\Users\\DEV\\Documents\\');
  const [cloneFeedback, setCloneFeedback] = useState(null);

  // Formulário de Novo Projeto
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectParentDir, setNewProjectParentDir] = useState('C:\\Users\\DEV\\Documents\\');
  const [initGit, setInitGit] = useState(true);

  if (!isOpen) return null;

  const filteredProjects = (projectsList || []).filter(
    (p) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.path?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.branch?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (project) => {
    onSelectProject(project);
    onClose();
  };

  const handleOpenLocalFolder = (e) => {
    e.preventDefault();
    if (!localPath.trim()) return;

    const cleanPath = localPath.trim();
    const parts = cleanPath.replace(/\\/g, '/').split('/').filter(Boolean);
    const inferredName = localProjectName.trim() || parts[parts.length - 1] || 'Novo Projeto Local';

    const newProject = {
      name: inferredName,
      path: cleanPath,
      branch: 'main',
      remoteUrl: '',
      isGit: true,
      lastAccessed: Date.now()
    };

    if (onAddProject) {
      onAddProject(newProject);
    }
    onSelectProject(newProject);
    onClose();
  };

  const handleCloneGithub = (e) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;

    const url = githubUrl.trim();
    const repoNameMatch = url.match(/\/([^/]+?)(?:\.git)?$/);
    const repoName = repoNameMatch ? repoNameMatch[1] : 'projeto-clonado';
    const targetDir = cloneTargetPath.endsWith('\\') || cloneTargetPath.endsWith('/')
      ? `${cloneTargetPath}${repoName}`
      : `${cloneTargetPath}\\${repoName}`;

    const newProject = {
      name: repoName,
      path: targetDir,
      branch: 'main',
      remoteUrl: url,
      isGit: true,
      lastAccessed: Date.now()
    };

    if (onAddProject) {
      onAddProject(newProject);
    }
    onSelectProject(newProject);
    onClose();
  };

  const handleCreateNewProject = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const name = newProjectName.trim();
    const baseDir = newProjectParentDir.endsWith('\\') || newProjectParentDir.endsWith('/')
      ? newProjectParentDir
      : `${newProjectParentDir}\\`;
    const fullPath = `${baseDir}${name}`;

    const newProject = {
      name,
      path: fullPath,
      branch: 'main',
      remoteUrl: '',
      isGit: initGit,
      lastAccessed: Date.now()
    };

    if (onAddProject) {
      onAddProject(newProject);
    }
    onSelectProject(newProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-espresso-950/70 dark:bg-denim-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-denim-900 border border-beige-300 dark:border-denim-700 rounded-2xl shadow-warm-lg dark:shadow-denim-lg overflow-hidden flex flex-col max-h-[85vh] text-espresso-900 dark:text-denim-100 transition-colors duration-150">
        {/* Modal Header */}
        <div className="p-4 border-b border-beige-200 dark:border-denim-800 flex items-center justify-between bg-beige-50 dark:bg-denim-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center text-espresso-950 font-bold border border-gold-400/80 shadow-xs">
              <IconGitBranch className="w-4 h-4 text-espresso-950" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-espresso-950 dark:text-denim-50 uppercase tracking-wider font-mono">
                Alternar Projeto Focado
              </h2>
              <p className="text-[11px] text-espresso-600 dark:text-denim-300 font-mono">
                Projeto Ativo:{' '}
                <strong className="text-espresso-950 dark:text-denim-100">{activeProject?.name || 'HiperCloudShell'}</strong>{' '}
                ({activeProject?.branch || 'main'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-espresso-500 dark:text-denim-400 hover:text-espresso-950 dark:hover:text-denim-50 hover:bg-beige-200 dark:hover:bg-denim-750 transition cursor-pointer"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-abas de Origem do Projeto */}
        <div className="px-4 border-b border-beige-200 dark:border-denim-800 bg-beige-100/60 dark:bg-denim-950 flex flex-wrap gap-1 text-xs font-mono py-1.5">
          {[
            { id: 'saved', label: 'Projetos Salvos / Recentes' },
            { id: 'local_folder', label: 'Abrir Pasta Local do PC' },
            { id: 'clone_github', label: 'Importar / Clonar GitHub' },
            { id: 'create_new', label: 'Criar Novo Projeto' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gold-500 text-espresso-950 shadow-xs'
                  : 'text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50 hover:bg-beige-200 dark:hover:bg-denim-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-beige-50/50 dark:bg-denim-900">
          {/* ================================================================= */}
          {/* ABA 1: PROJETOS SALVOS / RECENTES                                 */}
          {/* ================================================================= */}
          {activeTab === 'saved' && (
            <div className="space-y-3">
              {/* Barra de Pesquisa */}
              <div className="flex items-center gap-2 bg-white dark:bg-denim-950 border border-beige-300 dark:border-denim-700 px-3 py-2 rounded-xl text-xs font-mono shadow-xs">
                <IconSearch className="w-4 h-4 text-espresso-500 dark:text-denim-400" />
                <input
                  type="text"
                  placeholder="Filtrar projetos por nome, branch ou caminho..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent flex-1 text-espresso-950 dark:text-denim-100 placeholder-espresso-400 dark:placeholder-denim-500 focus:outline-none text-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-espresso-400 hover:text-espresso-950 cursor-pointer"
                  >
                    <IconClose className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Lista de Projetos */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredProjects.length === 0 ? (
                  <div className="p-8 text-center text-espresso-500 dark:text-denim-400 font-mono text-xs border border-dashed border-beige-300 dark:border-denim-700 rounded-xl bg-white dark:bg-denim-850">
                    Nenhum projeto encontrado. Use as abas acima para carregar uma pasta ou clonar do GitHub.
                  </div>
                ) : (
                  filteredProjects.map((project) => {
                    const isSelected = activeProject?.path === project.path;
                    return (
                      <div
                        key={project.path || project.name}
                        className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-gold-500 bg-gold-50/80 dark:bg-gold-950/40 shadow-xs ring-1 ring-gold-400'
                            : 'border-beige-300 dark:border-denim-700 bg-white dark:bg-denim-850 hover:border-gold-400'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-extrabold text-espresso-950 dark:text-denim-50 font-mono">
                              {project.name}
                            </h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-beige-200 dark:bg-denim-800 text-espresso-800 dark:text-denim-200 font-bold border border-beige-300 dark:border-denim-700">
                               {project.branch || 'main'}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                                Ativo em Foco
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-espresso-600 dark:text-denim-300 font-mono mt-0.5 truncate max-w-lg">
                            {project.path}
                          </p>
                          {project.remoteUrl && (
                            <p className="text-[10px] text-gold-800 dark:text-gold-400 font-mono mt-0.5 truncate max-w-lg">
                              🔗 {project.remoteUrl}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isSelected ? (
                            <span className="px-3 py-1.5 rounded-lg bg-gold-100 dark:bg-gold-950/80 text-gold-900 dark:text-gold-300 text-xs font-mono font-bold border border-gold-300 dark:border-gold-700">
                              Projeto Selecionado ✓
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelect(project)}
                              className="px-3.5 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-400 active:bg-gold-600 text-espresso-950 font-bold text-xs shadow-xs transition cursor-pointer border border-gold-400 font-mono"
                            >
                              Focar Neste Projeto
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* ABA 2: ABRIR PASTA LOCAL DO COMPUTADOR                            */}
          {/* ================================================================= */}
          {activeTab === 'local_folder' && (
            <form onSubmit={handleOpenLocalFolder} className="space-y-4 font-mono text-xs">
              <div className="p-4 bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 rounded-xl space-y-3 shadow-xs">
                <div>
                  <label className="block text-espresso-950 dark:text-denim-50 font-extrabold mb-1">
                    Caminho Absoluto da Pasta no PC:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: C:\Users\DEV\Documents\MeuProjeto ou /home/user/workspace/app"
                    value={localPath}
                    onChange={(e) => setLocalPath(e.target.value)}
                    className="w-full bg-beige-50 dark:bg-denim-950 border border-beige-300 dark:border-denim-700 rounded-lg p-2.5 text-xs text-espresso-950 dark:text-denim-100 focus:outline-none focus:border-gold-500 shadow-inner"
                  />
                  <p className="text-[10px] text-espresso-500 dark:text-denim-400 mt-1">
                    O sistema lerá a branch Git ativa, arquivos e histórico da pasta informada.
                  </p>
                </div>

                <div>
                  <label className="block text-espresso-950 dark:text-denim-50 font-extrabold mb-1">
                    Nome de Exibição do Projeto (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Deixe em branco para usar o nome da pasta"
                    value={localProjectName}
                    onChange={(e) => setLocalProjectName(e.target.value)}
                    className="w-full bg-beige-50 dark:bg-denim-950 border border-beige-300 dark:border-denim-700 rounded-lg p-2 text-xs text-espresso-950 dark:text-denim-100 focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-beige-200/70 dark:bg-denim-800 hover:bg-beige-300 dark:hover:bg-denim-700 text-espresso-900 dark:text-denim-100 font-bold text-xs border border-beige-300 dark:border-denim-700 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 active:bg-gold-600 text-espresso-950 font-bold text-xs shadow-xs transition cursor-pointer border border-gold-400"
                >
                  Carregar e Focar no Projeto
                </button>
              </div>
            </form>
          )}

          {/* ================================================================= */}
          {/* ABA 3: IMPORTAR / CLONAR DO GITHUB                                */}
          {/* ================================================================= */}
          {activeTab === 'clone_github' && (
            <form onSubmit={handleCloneGithub} className="space-y-4 font-mono text-xs">
              <div className="p-4 bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 rounded-xl space-y-3 shadow-xs">
                <div>
                  <label className="block text-espresso-950 dark:text-denim-50 font-extrabold mb-1">
                    URL do Repositório GitHub (HTTPS ou SSH):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: https://github.com/tiagohbs/HiperCloudShell.git"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full bg-beige-50 dark:bg-denim-950 border border-beige-300 dark:border-denim-700 rounded-lg p-2.5 text-xs text-espresso-950 dark:text-denim-100 focus:outline-none focus:border-gold-500 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-espresso-950 dark:text-denim-50 font-extrabold mb-1">
                    Pasta de Destino Local no PC:
                  </label>
                  <input
                    type="text"
                    required
                    value={cloneTargetPath}
                    onChange={(e) => setCloneTargetPath(e.target.value)}
                    className="w-full bg-beige-50 dark:bg-denim-950 border border-beige-300 dark:border-denim-700 rounded-lg p-2.5 text-xs text-espresso-950 dark:text-denim-100 focus:outline-none focus:border-gold-500 shadow-inner"
                  />
                  <p className="text-[10px] text-espresso-500 dark:text-denim-400 mt-1">
                    O repositório será configurado com tracking da branch remota.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-beige-200/70 dark:bg-denim-800 hover:bg-beige-300 dark:hover:bg-denim-700 text-espresso-900 dark:text-denim-100 font-bold text-xs border border-beige-300 dark:border-denim-700 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 active:bg-gold-600 text-espresso-950 font-bold text-xs shadow-xs transition cursor-pointer border border-gold-400"
                >
                  Clonar e Focar no Projeto
                </button>
              </div>
            </form>
          )}

          {/* ================================================================= */}
          {/* ABA 4: CRIAR NOVO PROJETO LOCAL                                   */}
          {/* ================================================================= */}
          {activeTab === 'create_new' && (
            <form onSubmit={handleCreateNewProject} className="space-y-4 font-mono text-xs">
              <div className="p-4 bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 rounded-xl space-y-3 shadow-xs">
                <div>
                  <label className="block text-espresso-950 dark:text-denim-50 font-extrabold mb-1">
                    Nome do Novo Projeto:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: meu-novo-app"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full bg-beige-50 dark:bg-denim-950 border border-beige-300 dark:border-denim-700 rounded-lg p-2.5 text-xs text-espresso-950 dark:text-denim-100 focus:outline-none focus:border-gold-500 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-espresso-950 dark:text-denim-50 font-extrabold mb-1">
                    Diretório Pai no Disco:
                  </label>
                  <input
                    type="text"
                    required
                    value={newProjectParentDir}
                    onChange={(e) => setNewProjectParentDir(e.target.value)}
                    className="w-full bg-beige-50 dark:bg-denim-950 border border-beige-300 dark:border-denim-700 rounded-lg p-2.5 text-xs text-espresso-950 dark:text-denim-100 focus:outline-none focus:border-gold-500 shadow-inner"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={initGit}
                      onChange={(e) => setInitGit(e.target.checked)}
                      className="accent-gold-500 cursor-pointer"
                    />
                    <span className="text-espresso-800 dark:text-denim-200 font-bold">
                      Inicializar repositório Git automaticamente (`git init`)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-beige-200/70 dark:bg-denim-800 hover:bg-beige-300 dark:hover:bg-denim-700 text-espresso-900 dark:text-denim-100 font-bold text-xs border border-beige-300 dark:border-denim-700 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 active:bg-gold-600 text-espresso-950 font-bold text-xs shadow-xs transition cursor-pointer border border-gold-400"
                >
                  Criar e Focar no Projeto
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
