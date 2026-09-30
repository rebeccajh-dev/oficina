# Frontend — Sistema de Recomendação de Jogadores (Scouting Inteligente)

Interface web interativa desenvolvida em **React 19**, **TypeScript**, **Vite** e **Tailwind CSS v4** para visualização e interação com o sistema de recomendação de jogadores de futebol.

---

## ⚙️ Pré-requisitos

- **Node.js** `>= 18.0.0` (recomendado `>= 20.x`)
- **npm** `>= 9.x` (ou gerenciador compatível: pnpm / yarn)
- Backend em execução (por padrão em `http://localhost:8000`)

---

## 📦 Dependências

As dependências estão gerenciadas no arquivo [`package.json`](file:///c:/Users/nnast/Desktop/oficina/frontend/package.json):

### Produção (`dependencies`)
- **`react` (`^19.2.8`)**: Biblioteca principal para construção da interface de usuário baseada em componentes.
- **`react-dom` (`^19.2.8`)**: Renderizador do React para o DOM do navegador.
- **`tailwindcss` (`^4.3.3`) & `@tailwindcss/vite` (`^4.3.3`)**: Framework CSS utilitário integrado diretamente ao Vite para estilização responsiva.

### Desenvolvimento (`devDependencies`)
- **`vite` (`^8.3.0`)**: Build tool e servidor de desenvolvimento com Hot Module Replacement (HMR).
- **`typescript` (`~6.0.2`)**: Suporte a tipagem estática e segurança em tempo de compilação.
- **`@vitejs/plugin-react` (`^6.1.1`)**: Plugin oficial do Vite para React.
- **`eslint` (`^10.10.0`)**, **`typescript-eslint`**, plugins do React: Ferramentas de análise estática e padronização de código.
- Definições de tipos: `@types/react`, `@types/react-dom`, `@types/node`.

---

## 🚀 Como Executar

1. **Acesse a pasta do frontend:**
   ```bash
   cd frontend
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   A aplicação será iniciada localmente (geralmente em [http://localhost:5173](http://localhost:5173)).

---

## 🛠 Scripts Disponíveis

- `npm run dev`: Inicia o servidor local de desenvolvimento com recarregamento rápido (HMR).
- `npm run build`: Valida os tipos TypeScript (`tsc -b`) e compila a aplicação para produção no diretório `dist/`.
- `npm run preview`: Executa um servidor local para visualizar o build gerado em `dist/`.
- `npm run lint`: Executa a verificação de código com ESLint.

---

## 🔗 Integração com o Backend e Configuração

Por padrão, a aplicação se comunica com o backend no endereço `http://localhost:8000`.

Para alterar a URL da API (por exemplo, em produção ou em outra porta), crie um arquivo `.env` na raiz da pasta `frontend/`:

```env
VITE_API_URL=http://localhost:8000
```
