import { buildTeacherSpec } from './_teacher-mode'

export const lesson00Spec = buildTeacherSpec({
  lessonContext: '00. 환경 설정 (Course Setup)',
  presets: [
    {
      id: 'pat-procedure',
      label: 'GitHub Models PAT 발급 절차',
      question: 'GitHub Models를 쓰기 위한 fine-grained PAT 발급 절차를 단계별로 알려줘. Models:read 권한이 정확히 어디 있는지도 짚어줘.',
    },
    {
      id: 'models-permission',
      label: 'Models:read 권한이 뭐야?',
      question: 'GitHub PAT 권한 중 "Account permissions → Models"가 정확히 무엇을 허용하는 권한인지, 다른 권한과 어떻게 다른지 설명해줘.',
    },
    {
      id: 'venv-why',
      label: 'Python venv가 왜 필요해?',
      question: 'Python venv(가상환경)가 왜 필요한지, 시스템 Python에 직접 설치하면 어떤 문제가 생기는지 비유로 설명해줘.',
    },
    {
      id: 'jupyter-vscode',
      label: 'VSCode에서 Jupyter notebook 열기',
      question: 'VSCode에서 .ipynb 파일을 열고 셀을 실행하려면 어떤 확장이 필요하고 어떤 단계로 설정해야 하는지 알려줘.',
    },
  ],
})
