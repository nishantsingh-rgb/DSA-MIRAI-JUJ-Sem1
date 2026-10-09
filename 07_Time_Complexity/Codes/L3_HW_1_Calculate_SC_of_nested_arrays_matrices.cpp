#include <iostream>
using namespace std;

int main() {
    const int R = 3, C = 4;
    int mat[R][C];
    int cells = 0;

    for (int i = 0; i < R; i++) {
        for (int j = 0; j < C; j++) {
            mat[i][j] = i * C + j;
            cells++;
        }
    }

    for (int i = 0; i < R; i++) {
        for (int j = 0; j < C; j++) {
            cout << mat[i][j] << "\t";
        }
        cout << endl;
    }

    cout << "Cells used: " << cells << " = R * C" << endl;
    cout << "For an N x N matrix that is N^2, so SC = O(N^2)" << endl;
    return 0;
}
