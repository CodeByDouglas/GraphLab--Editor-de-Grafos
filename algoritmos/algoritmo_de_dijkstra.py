vertice_inicio = 0
vertice_final = 0
vertices_visitados = []
menor_distancia_de_cada_vertice = []
menor_caminho = []
fila = []



#O grafo tem que ser nesse formato: [[[vertice, peso], [vertice, peso]], [[Vertice, peso], [Vertice, peso]]....]

def algoritmo_de_dijkstra(grafo,vertice_inicio,vertice_final):
    
    for cont in range(len(grafo)):
           menor_distancia_de_cada_vertice.append(0) #Cria um slot com valor 0 (inteiro) para cada vertice do grafo que armazena a menor distancia até o momento.
           menor_caminho.append(0) #Sequencia de vertice do menor caminho encotrado até cada vertice. 
    
    fila.append(vertice_inicio) #Adiciona o vertice de inicio selecionado pelo user na fila.
    menor_caminho[vertice_inicio] = vertice_inicio #Adiciona o caminho do número icial sendo igual a ele mesmo.

    for vertice_da_fila in fila: #vertice da fila vai assumir cada um dos valores presentes na fila.
        for x in grafo[vertice_da_fila]: # X vai se tornar cada uma das arestas([vertice, peso]) que o que aquele vertice possui.
            vertices_visitados.append(vertice_da_fila)
            
            if (menor_distancia_de_cada_vertice[x[0]] == 0) or (menor_distancia_de_cada_vertice[x[0]] > menor_distancia_de_cada_vertice[vertice_da_fila] + x[1]): #verifica se a menor distancia do vertice que estamos visitado é igual a 0 ou se é a menor distancia. 
                    menor_distancia_de_cada_vertice[x[0]] = menor_distancia_de_cada_vertice[vertice_da_fila] + x[1] #Soma a distancia do vertice da fila que está sendo vesitado mais a distancia até o vertice da aresta autal dando assim  a nova distancia até esse vertice. 
                    menor_caminho[x[0]] = vertice_da_fila #Concatena o caminho até o vertice que está sendo visitado e adiciona o vertice que se conecta, criando assim o novo menor caminho até aquele vertice.
                    
                    if (x[0] != vertice_final) and (x[0] not in vertices_visitados):   #Verifica se não é o objetivo e se não foi visitado.
                        
                        if (menor_distancia_de_cada_vertice[vertice_final] == 0) or (menor_distancia_de_cada_vertice[x[0]] < menor_distancia_de_cada_vertice[vertice_final]):                   
                            fila.append(x[0])#Adiciona o vertice que da aresta na fila para ser expandido.
    index = vertice_final
    caminho_montado = []
    caminho_montado.append(index)
    
    #Verifica se o número de objetivo foi visitado, caso não tenha significa não tem conexão entre os vertices escolhidos.
    if (vertice_final != vertice_inicio) and (menor_distancia_de_cada_vertice[vertice_final] == 0):
        print(f"Não existe caminho entre os vértices {vertice_inicio} e {vertice_final}.")
        return
    
    #Monta o caminho do vertice de final até o vertice de inicio.
    while index != vertice_inicio:
        caminho_montado = [menor_caminho[index]] + caminho_montado 
        index = menor_caminho[index]


    print(caminho_montado)    